using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RidesController : ControllerBase
    {
        private readonly RideDbContext _context;

        public RidesController(RideDbContext context)
        {
            _context = context;
        }

        // GET: api/rides
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Ride>>> GetRides([FromQuery] string? status = null)
        {
            var query = _context.Rides
                .Include(r => r.Driver)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            return await query
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        // GET: api/rides/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Ride>> GetRide(int id)
        {
            var ride = await _context.Rides
                .Include(r => r.Driver)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (ride == null)
            {
                return NotFound();
            }

            return ride;
        }

        // GET: api/rides/rider/{riderId}
        [HttpGet("rider/{riderId}")]
        public async Task<ActionResult<IEnumerable<Ride>>> GetRidesByRider(int riderId, [FromQuery] string? status = null)
        {
            var query = _context.Rides
                .Include(r => r.Driver)
                .Where(r => r.RiderId == riderId)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            return await query
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        // GET: api/rides/history
        [HttpGet("history")]
        public async Task<ActionResult<IEnumerable<Ride>>> GetRideHistory()
        {
            return await _context.Rides
                .Include(r => r.Driver)
                .Where(r => r.Status == "Completed")
                .OrderByDescending(r => r.EndTime)
                .ToListAsync();
        }

        // POST: api/rides
        [HttpPost]
        public async Task<ActionResult<Ride>> CreateRide(CreateRideDto createRideDto)
        {
            // Check if rider already has a pending ride
            var existingRide = await _context.Rides
                .FirstOrDefaultAsync(r => r.RiderId == createRideDto.RiderId && r.Status == "Requested");

            if (existingRide != null)
            {
                return BadRequest("You already have a pending ride request.");
            }

            var ride = new Ride
            {
                RiderId = createRideDto.RiderId,
                RiderName = createRideDto.RiderName,
                PickupLocation = createRideDto.PickupLocation,
                DropoffLocation = createRideDto.DropoffLocation,
                PassengerCount = createRideDto.PassengerCount,
                CartSize = createRideDto.CartSize,
                SpecialNotes = createRideDto.SpecialNotes,
                EstimatedFare = createRideDto.EstimatedFare,
                Status = "Requested",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Rides.Add(ride);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRide), new { id = ride.Id }, ride);
        }

        // PUT: api/rides/{id}/accept
        [HttpPut("{id}/accept")]
        public async Task<IActionResult> AcceptRide(int id, AcceptRideDto acceptRideDto)
        {
            var ride = await _context.Rides.FindAsync(id);

            if (ride == null)
            {
                return NotFound();
            }

            if (ride.Status != "Requested")
            {
                return BadRequest("This ride is no longer available.");
            }

            // Check if driver is available
            var driver = await _context.Drivers.FindAsync(acceptRideDto.DriverId);
            if (driver == null || !driver.IsAvailable)
            {
                return BadRequest("Driver is not available.");
            }

            // Update ride
            ride.DriverId = acceptRideDto.DriverId;
            ride.Status = "In Progress";
            ride.StartTime = DateTime.UtcNow;
            ride.UpdatedAt = DateTime.UtcNow;

            // Update driver
            driver.CurrentRideId = ride.Id;
            driver.IsAvailable = false;
            driver.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/rides/{id}/driver-location
        [HttpPut("{id}/driver-location")]
        public async Task<IActionResult> UpdateDriverLocation(int id, [FromBody] UpdateDriverLocationDto dto)
        {
            var ride = await _context.Rides.FindAsync(id);

            if (ride == null)
            {
                return NotFound();
            }

            if (ride.Status != "In Progress")
            {
                return BadRequest("This ride is not in progress.");
            }

            // Validate driver location values
            if (!new[] { "PreRide", "OnWay", "AtPickup", "AtDropoff" }.Contains(dto.DriverLocation))
            {
                return BadRequest("Invalid driver location. Must be 'PreRide', 'OnWay', 'AtPickup', or 'AtDropoff'.");
            }

            ride.DriverLocation = dto.DriverLocation;
            ride.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/rides/{id}/complete
        [HttpPut("{id}/complete")]
        public async Task<IActionResult> CompleteRide(int id, CompleteRideDto completeRideDto)
        {
            var ride = await _context.Rides.FindAsync(id);

            if (ride == null)
            {
                return NotFound();
            }

            if (ride.Status != "In Progress")
            {
                return BadRequest("This ride is not in progress.");
            }

            // Update ride
            ride.Status = "Completed";
            ride.EndTime = DateTime.UtcNow;
            ride.UpdatedAt = DateTime.UtcNow;

            // Update driver
            var driver = await _context.Drivers.FindAsync(completeRideDto.DriverId);
            if (driver != null)
            {
                driver.CurrentRideId = null;
                driver.IsAvailable = true;
                driver.TotalRides++;
                driver.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/rides/{id}/cancel
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelRide(int id)
        {
            var ride = await _context.Rides.FindAsync(id);

            if (ride == null)
            {
                return NotFound();
            }

            if (ride.Status != "Requested")
            {
                return BadRequest("This ride cannot be cancelled.");
            }

            ride.Status = "Cancelled";
            ride.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/rides/{id}/rate-driver
        [HttpPost("{id}/rate-driver")]
        public async Task<IActionResult> RateDriver(int id, [FromBody] SubmitDriverRatingDto ratingDto)
        {
            if (ratingDto.RideId != id)
            {
                return BadRequest("Ride ID mismatch.");
            }

            var ride = await _context.Rides.FindAsync(id);
            if (ride == null)
            {
                return NotFound();
            }

            if (ride.Status != "Completed")
            {
                return BadRequest("Can only rate completed rides.");
            }

            ride.DriverRating = ratingDto.Rating;
            ride.DriverComments = ratingDto.Comments;
            ride.UpdatedAt = DateTime.UtcNow;

            // Update driver's average rating
            if (ride.DriverId.HasValue)
            {
                var driver = await _context.Drivers.FindAsync(ride.DriverId.Value);
                if (driver != null)
                {
                    // Calculate average rating for this driver
                    var driverRatings = await _context.Rides
                        .Where(r => r.DriverId == ride.DriverId && r.DriverRating.HasValue)
                        .Select(r => r.DriverRating.Value)
                        .ToListAsync();

                    if (driverRatings.Any())
                    {
                        driver.AverageRating = (decimal)driverRatings.Average();
                        driver.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/rides/{id}/rate-rider
        [HttpPost("{id}/rate-rider")]
        public async Task<IActionResult> RateRider(int id, [FromBody] SubmitRiderRatingDto ratingDto)
        {
            if (ratingDto.RideId != id)
            {
                return BadRequest("Ride ID mismatch.");
            }

            var ride = await _context.Rides.FindAsync(id);
            if (ride == null)
            {
                return NotFound();
            }

            if (ride.Status != "Completed")
            {
                return BadRequest("Can only rate completed rides.");
            }

            ride.RiderRating = ratingDto.Rating;
            ride.RiderComments = ratingDto.Comments;
            ride.UpdatedAt = DateTime.UtcNow;

            // Update rider's average rating
            if (ride.RiderId.HasValue)
            {
                var rider = await _context.Riders.FindAsync(ride.RiderId.Value);
                if (rider != null)
                {
                    // Calculate average rating for this rider
                    var riderRatings = await _context.Rides
                        .Where(r => r.RiderId == ride.RiderId && r.RiderRating.HasValue)
                        .Select(r => r.RiderRating.Value)
                        .ToListAsync();

                    if (riderRatings.Any())
                    {
                        rider.AverageRating = (decimal)riderRatings.Average();
                        rider.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
