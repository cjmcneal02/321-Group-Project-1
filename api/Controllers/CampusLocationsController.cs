using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CampusLocationsController : ControllerBase
    {
        private readonly RideDbContext _context;

        public CampusLocationsController(RideDbContext context)
        {
            _context = context;
        }

        // GET: api/campuslocations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CampusLocation>>> GetCampusLocations()
        {
            return await _context.CampusLocations
                .OrderBy(l => l.Name)
                .ToListAsync();
        }

        // GET: api/campuslocations/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<CampusLocation>> GetCampusLocation(int id)
        {
            var location = await _context.CampusLocations.FindAsync(id);

            if (location == null)
            {
                return NotFound();
            }

            return location;
        }

        // GET: api/campuslocations/type/{type}
        [HttpGet("type/{type}")]
        public async Task<ActionResult<IEnumerable<CampusLocation>>> GetCampusLocationsByType(string type)
        {
            var locations = await _context.CampusLocations
                .Where(l => l.Type == type)
                .OrderBy(l => l.Name)
                .ToListAsync();

            return locations;
        }

        // POST: api/campuslocations
        [HttpPost]
        public async Task<ActionResult<CampusLocation>> CreateCampusLocation(CreateCampusLocationDto dto)
        {
            // Check if location name already exists
            if (await _context.CampusLocations.AnyAsync(l => l.Name == dto.Name))
            {
                return BadRequest("Location name already exists");
            }

            var location = new CampusLocation
            {
                Name = dto.Name,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Type = dto.Type,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CampusLocations.Add(location);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCampusLocation), new { id = location.Id }, location);
        }

        // PUT: api/campuslocations/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCampusLocation(int id, UpdateCampusLocationDto dto)
        {
            var location = await _context.CampusLocations.FindAsync(id);
            if (location == null)
            {
                return NotFound();
            }

            // Check if location name already exists (excluding current location)
            if (dto.Name != location.Name && await _context.CampusLocations.AnyAsync(l => l.Name == dto.Name))
            {
                return BadRequest("Location name already exists");
            }

            location.Name = dto.Name;
            location.Latitude = dto.Latitude;
            location.Longitude = dto.Longitude;
            location.Type = dto.Type;
            location.UpdatedAt = DateTime.UtcNow;

            _context.CampusLocations.Update(location);
            await _context.SaveChangesAsync();

            return Ok(location);
        }

        // DELETE: api/campuslocations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCampusLocation(int id)
        {
            var location = await _context.CampusLocations.FindAsync(id);
            if (location == null)
            {
                return NotFound();
            }

            _context.CampusLocations.Remove(location);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Campus location deleted successfully" });
        }
    }
}
