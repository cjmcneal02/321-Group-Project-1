using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RideRequestsController : ControllerBase
    {
        private readonly RideDbContext _context;

        public RideRequestsController(RideDbContext context)
        {
            _context = context;
        }

        // GET: api/riderequests
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RideRequest>>> GetRideRequests()
        {
            return await _context.RideRequests
                .Where(r => r.Status == "Pending")
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        // GET: api/riderequests/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<RideRequest>> GetRideRequest(int id)
        {
            var rideRequest = await _context.RideRequests.FindAsync(id);

            if (rideRequest == null)
            {
                return NotFound();
            }

            return rideRequest;
        }

        // POST: api/riderequests
        [HttpPost]
        public async Task<ActionResult<RideRequest>> CreateRideRequest([FromBody] CreateRideRequestDto dto)
        {
            // Check for duplicate requests (same rider, pickup, dropoff within last 30 seconds)
            var thirtySecondsAgo = DateTime.UtcNow.AddSeconds(-30);
            var duplicateRequest = await _context.RideRequests
                .FirstOrDefaultAsync(r => 
                    r.RiderName == dto.RiderName &&
                    r.PickupLocation == dto.PickupLocation &&
                    r.DropoffLocation == dto.DropoffLocation &&
                    r.CreatedAt > thirtySecondsAgo);

            if (duplicateRequest != null)
            {
                return Ok(duplicateRequest); // Return existing request
            }

            var rideRequest = new RideRequest
            {
                RiderName = dto.RiderName,
                PickupLocation = dto.PickupLocation,
                DropoffLocation = dto.DropoffLocation,
                PassengerCount = dto.PassengerCount,
                CartSize = dto.CartSize,
                EstimatedFare = dto.EstimatedFare,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.RideRequests.Add(rideRequest);
            await _context.SaveChangesAsync();

            // Attempt auto-assign to an available driver immediately
            try
            {
                var availableDriver = await _context.Drivers
                    .Where(d => d.IsAvailable)
                    .OrderByDescending(d => d.Rating)
                    .FirstOrDefaultAsync();

                if (availableDriver != null)
                {
                    var ride = new Ride
                    {
                        RideRequestId = rideRequest.Id,
                        DriverId = availableDriver.Id,
                        RiderName = rideRequest.RiderName,
                        PickupLocation = rideRequest.PickupLocation,
                        DropoffLocation = rideRequest.DropoffLocation,
                        PassengerCount = rideRequest.PassengerCount,
                        CartSize = rideRequest.CartSize,
                        EstimatedFare = rideRequest.EstimatedFare,
                        Status = "Active",
                        StartTime = DateTime.UtcNow,
                        Distance = CalculateDistance(rideRequest.PickupLocation, rideRequest.DropoffLocation),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    // Update statuses
                    rideRequest.Status = "Accepted";
                    rideRequest.UpdatedAt = DateTime.UtcNow;

                    availableDriver.IsAvailable = false;
                    availableDriver.CurrentRideId = ride.Id;
                    availableDriver.Status = "On Ride";
                    availableDriver.UpdatedAt = DateTime.UtcNow;

                    _context.Rides.Add(ride);
                    _context.RideRequests.Update(rideRequest);
                    _context.Drivers.Update(availableDriver);
                    await _context.SaveChangesAsync();
                }
            }
            catch
            {
                // Swallow auto-assign failure; the request remains pending for manual assignment
            }

            return CreatedAtAction(nameof(GetRideRequest), new { id = rideRequest.Id }, rideRequest);
        }

        // DELETE: api/riderequests/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRideRequest(int id)
        {
            var rideRequest = await _context.RideRequests.FindAsync(id);
            if (rideRequest == null)
            {
                return NotFound();
            }

            _context.RideRequests.Remove(rideRequest);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/riderequests/{id}/accept
        [HttpPost("{id}/accept")]
        public async Task<ActionResult<Ride>> AcceptRideRequest(int id, AcceptRideRequestDto dto)
        {
            Console.WriteLine($"AcceptRideRequest called with id={id}, DriverId={dto.DriverId}, RideRequestId={dto.RideRequestId}");
            
            var rideRequest = await _context.RideRequests.FindAsync(id);
            if (rideRequest == null)
            {
                Console.WriteLine($"Ride request {id} not found");
                return NotFound("Ride request not found");
            }

            var driver = await _context.Drivers.FindAsync(dto.DriverId);
            if (driver == null)
            {
                Console.WriteLine($"Driver {dto.DriverId} not found");
                return NotFound("Driver not found");
            }

            Console.WriteLine($"Driver {dto.DriverId} found: IsAvailable={driver.IsAvailable}, Status={driver.Status}");
            if (!driver.IsAvailable)
            {
                Console.WriteLine($"Driver {dto.DriverId} is not available");
                return BadRequest("Driver is not available");
            }

            // Create new ride
            var ride = new Ride
            {
                RideRequestId = rideRequest.Id,
                DriverId = driver.Id,
                RiderName = rideRequest.RiderName,
                PickupLocation = rideRequest.PickupLocation,
                DropoffLocation = rideRequest.DropoffLocation,
                PassengerCount = rideRequest.PassengerCount,
                CartSize = rideRequest.CartSize,
                EstimatedFare = rideRequest.EstimatedFare,
                Status = "Active",
                StartTime = DateTime.UtcNow,
                Distance = CalculateDistance(rideRequest.PickupLocation, rideRequest.DropoffLocation),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Update ride request status
            rideRequest.Status = "Accepted";
            rideRequest.UpdatedAt = DateTime.UtcNow;

            // Update driver status
            driver.IsAvailable = false;
            driver.CurrentRideId = ride.Id;
            driver.Status = "On Ride";
            driver.UpdatedAt = DateTime.UtcNow;

            _context.Rides.Add(ride);
            _context.RideRequests.Update(rideRequest);
            _context.Drivers.Update(driver);
            await _context.SaveChangesAsync();

            return Ok(ride);
        }

        // POST: api/riderequests/{id}/decline
        [HttpPost("{id}/decline")]
        public async Task<ActionResult> DeclineRideRequest(int id, DeclineRideRequestDto dto)
        {
            var rideRequest = await _context.RideRequests.FindAsync(id);
            if (rideRequest == null)
            {
                return NotFound("Ride request not found");
            }

            var driver = await _context.Drivers.FindAsync(dto.DriverId);
            if (driver == null)
            {
                return NotFound("Driver not found");
            }

            // Add driver to declined list
            if (string.IsNullOrEmpty(rideRequest.DeclinedByDrivers))
            {
                rideRequest.DeclinedByDrivers = dto.DriverId.ToString();
            }
            else
            {
                rideRequest.DeclinedByDrivers += $",{dto.DriverId}";
            }

            rideRequest.UpdatedAt = DateTime.UtcNow;
            _context.RideRequests.Update(rideRequest);
            await _context.SaveChangesAsync();

            return Ok();
        }

        private int CalculateDistance(string pickup, string dropoff)
        {
            // Simple distance calculation - in a real app, you'd use actual coordinates
            var locations = new Dictionary<string, int>
            {
                { "Hewson Hall", 1 },
                { "Presidential Village", 2 },
                { "Student Center", 3 },
                { "Library", 4 },
                { "Gymnasium", 5 }
            };

            var pickupValue = locations.GetValueOrDefault(pickup, 1);
            var dropoffValue = locations.GetValueOrDefault(dropoff, 1);
            
            return Math.Abs(dropoffValue - pickupValue) * 2; // 2 minutes per unit
        }
    }
}
