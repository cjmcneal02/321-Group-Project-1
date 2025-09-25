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
        public async Task<ActionResult<IEnumerable<Ride>>> GetRides()
        {
            return await _context.Rides
                .Include(r => r.Driver)
                .Include(r => r.RideRequest)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        // GET: api/rides/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Ride>> GetRide(int id)
        {
            var ride = await _context.Rides
                .Include(r => r.Driver)
                .Include(r => r.RideRequest)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (ride == null)
            {
                return NotFound();
            }

            return ride;
        }

        // GET: api/rides/active
        [HttpGet("active")]
        public async Task<ActionResult<Ride>> GetActiveRide()
        {
            var activeRide = await _context.Rides
                .Include(r => r.Driver)
                .Include(r => r.RideRequest)
                .FirstOrDefaultAsync(r => r.Status == "Active");

            if (activeRide == null)
            {
                return NotFound();
            }

            return activeRide;
        }

        // GET: api/rides/history
        [HttpGet("history")]
        public async Task<ActionResult<IEnumerable<Ride>>> GetRideHistory()
        {
            return await _context.Rides
                .Include(r => r.Driver)
                .Include(r => r.RideRequest)
                .Where(r => r.Status == "Completed")
                .OrderByDescending(r => r.EndTime)
                .ToListAsync();
        }
    }
}
