using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DriversController : ControllerBase
    {
        private readonly RideDbContext _context;

        public DriversController(RideDbContext context)
        {
            _context = context;
        }

        // GET: api/drivers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Driver>>> GetDrivers()
        {
            return await _context.Drivers.ToListAsync();
        }

        // GET: api/drivers/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Driver>> GetDriver(int id)
        {
            var driver = await _context.Drivers.FindAsync(id);

            if (driver == null)
            {
                return NotFound();
            }

            return driver;
        }

        // GET: api/drivers/available
        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<Driver>>> GetAvailableDrivers()
        {
            var drivers = await _context.Drivers
                .Where(d => d.IsAvailable)
                .ToListAsync();
            
            // Order by rating on client side since SQLite doesn't support decimal in ORDER BY
            return drivers.OrderByDescending(d => d.Rating).ToList();
        }

        // PUT: api/drivers/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateDriverStatus(int id, [FromBody] UpdateDriverStatusDto dto)
        {
            var driver = await _context.Drivers.FindAsync(id);
            if (driver == null)
            {
                return NotFound();
            }

            driver.IsAvailable = dto.IsAvailable;
            driver.Status = dto.IsAvailable ? "Active" : "Offline";
            driver.UpdatedAt = DateTime.UtcNow;

            _context.Drivers.Update(driver);
            await _context.SaveChangesAsync();

            return Ok(driver);
        }

        // POST: api/drivers/{id}/complete-ride
        [HttpPost("{id}/complete-ride")]
        public async Task<IActionResult> CompleteRide(int id, CompleteRideDto dto)
        {
            var driver = await _context.Drivers.FindAsync(id);
            if (driver == null)
            {
                return NotFound("Driver not found");
            }

            var ride = await _context.Rides.FindAsync(dto.RideId);
            if (ride == null)
            {
                return NotFound("Ride not found");
            }

            if (ride.DriverId != id)
            {
                return BadRequest("Driver is not assigned to this ride");
            }

            // Update ride status
            ride.Status = "Completed";
            ride.EndTime = DateTime.UtcNow;
            ride.UpdatedAt = DateTime.UtcNow;

            // Update driver status
            driver.IsAvailable = true;
            driver.CurrentRideId = null;
            driver.Status = "Active";
            driver.TotalRides++;
            driver.UpdatedAt = DateTime.UtcNow;

            _context.Rides.Update(ride);
            _context.Drivers.Update(driver);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Ride completed successfully", ride });
        }
    }

    public class UpdateDriverStatusDto
    {
        public bool IsAvailable { get; set; }
    }
}
