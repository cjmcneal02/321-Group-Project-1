using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RidersController : ControllerBase
    {
        private readonly RideDbContext _context;

        public RidersController(RideDbContext context)
        {
            _context = context;
        }

        // GET: api/riders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetRiders()
        {
            return await _context.Riders
                .Select(r => new
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    Name = r.Name,
                    TotalRides = r.TotalRides,
                    RiderStatus = r.RiderStatus,
                    AverageRating = r.AverageRating,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt
                })
                .ToListAsync();
        }

        // GET: api/riders/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetRider(int id)
        {
            var rider = await _context.Riders
                .Where(r => r.Id == id)
                .Select(r => new
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    Name = r.Name,
                    TotalRides = r.TotalRides,
                    RiderStatus = r.RiderStatus,
                    AverageRating = r.AverageRating,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (rider == null)
            {
                return NotFound();
            }

            return rider;
        }

        // GET: api/riders/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<object>> GetRiderByUserId(int userId)
        {
            var rider = await _context.Riders
                .Where(r => r.UserId == userId)
                .Select(r => new
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    Name = r.Name,
                    TotalRides = r.TotalRides,
                    RiderStatus = r.RiderStatus,
                    AverageRating = r.AverageRating,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (rider == null)
            {
                return NotFound();
            }

            return rider;
        }

        // GET: api/riders/{id}/recent-rides
        [HttpGet("{id}/recent-rides")]
        public async Task<ActionResult<IEnumerable<object>>> GetRecentRides(int id)
        {
            var rider = await _context.Riders.FindAsync(id);
            if (rider == null)
            {
                return NotFound();
            }

            var recentRides = await _context.Rides
                .Include(r => r.Driver)
                .Where(r => r.RiderName == rider.Name && r.Status == "Completed")
                .OrderByDescending(r => r.EndTime)
                .Take(5)
                .Select(r => new
                {
                    Id = r.Id,
                    PickupLocation = r.PickupLocation,
                    DropoffLocation = r.DropoffLocation,
                    Date = r.EndTime,
                    DriverName = r.Driver != null ? r.Driver.Name : "Unknown",
                    Fare = r.EstimatedFare
                })
                .ToListAsync();

            return recentRides;
        }

        // PUT: api/riders/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRider(int id, Rider rider)
        {
            if (id != rider.Id)
            {
                return BadRequest();
            }

            _context.Entry(rider).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RiderExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/riders
        [HttpPost]
        public async Task<ActionResult<Rider>> CreateRider(Rider rider)
        {
            _context.Riders.Add(rider);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetRider", new { id = rider.Id }, rider);
        }

        // DELETE: api/riders/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRider(int id)
        {
            var rider = await _context.Riders.FindAsync(id);
            if (rider == null)
            {
                return NotFound();
            }

            _context.Riders.Remove(rider);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool RiderExists(int id)
        {
            return _context.Riders.Any(e => e.Id == id);
        }
    }
}
