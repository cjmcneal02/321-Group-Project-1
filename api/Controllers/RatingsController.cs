using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RatingsController : ControllerBase
    {
        private readonly RideDbContext _context;

        public RatingsController(RideDbContext context)
        {
            _context = context;
        }

        // POST: api/ratings/rider
        [HttpPost("rider")]
        public async Task<ActionResult<RiderRating>> CreateRiderRating([FromBody] CreateRiderRatingDto dto)
        {
            try
            {
                // Validate that the ride exists and is completed
                var ride = await _context.Rides
                    .Include(r => r.Driver)
                    .Include(r => r.Rider)
                    .FirstOrDefaultAsync(r => r.Id == dto.RideId);

                if (ride == null)
                {
                    return NotFound("Ride not found");
                }

                if (ride.Status != "Completed")
                {
                    return BadRequest("Can only rate completed rides");
                }

                if (ride.DriverId != dto.DriverId || ride.RiderId != dto.RiderId)
                {
                    return BadRequest("Invalid driver or rider for this ride");
                }

                // Check if rider has already rated this driver for this ride
                var existingRating = await _context.RiderRatings
                    .FirstOrDefaultAsync(rr => rr.RideId == dto.RideId && rr.DriverId == dto.DriverId && rr.RiderId == dto.RiderId);

                if (existingRating != null)
                {
                    return BadRequest("You have already rated this driver for this ride");
                }

                var riderRating = new RiderRating
                {
                    RideId = dto.RideId,
                    DriverId = dto.DriverId,
                    RiderId = dto.RiderId,
                    Rating = dto.Rating,
                    Comments = dto.Comments,
                    CreatedAt = DateTime.UtcNow
                };

                _context.RiderRatings.Add(riderRating);

                // Update driver's average rating
                await UpdateDriverAverageRating(dto.DriverId);

                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetRiderRating), new { id = riderRating.Id }, riderRating);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // POST: api/ratings/driver
        [HttpPost("driver")]
        public async Task<ActionResult<DriverRating>> CreateDriverRating([FromBody] CreateDriverRatingDto dto)
        {
            try
            {
                // Validate that the ride exists and is completed
                var ride = await _context.Rides
                    .Include(r => r.Driver)
                    .Include(r => r.Rider)
                    .FirstOrDefaultAsync(r => r.Id == dto.RideId);

                if (ride == null)
                {
                    return NotFound("Ride not found");
                }

                if (ride.Status != "Completed")
                {
                    return BadRequest("Can only rate completed rides");
                }

                if (ride.DriverId != dto.DriverId || ride.RiderId != dto.RiderId)
                {
                    return BadRequest("Invalid driver or rider for this ride");
                }

                // Check if driver has already rated this rider for this ride
                var existingRating = await _context.DriverRatings
                    .FirstOrDefaultAsync(dr => dr.RideId == dto.RideId && dr.DriverId == dto.DriverId && dr.RiderId == dto.RiderId);

                if (existingRating != null)
                {
                    return BadRequest("You have already rated this rider for this ride");
                }

                var driverRating = new DriverRating
                {
                    RideId = dto.RideId,
                    DriverId = dto.DriverId,
                    RiderId = dto.RiderId,
                    Rating = dto.Rating,
                    Comments = dto.Comments,
                    CreatedAt = DateTime.UtcNow
                };

                _context.DriverRatings.Add(driverRating);

                // Update rider's average rating
                await UpdateRiderAverageRating(dto.RiderId);

                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetDriverRating), new { id = driverRating.Id }, driverRating);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/ratings/rider/{id}
        [HttpGet("rider/{id}")]
        public async Task<ActionResult<RiderRating>> GetRiderRating(int id)
        {
            var rating = await _context.RiderRatings
                .Include(rr => rr.Ride)
                .Include(rr => rr.Driver)
                .Include(rr => rr.Rider)
                .FirstOrDefaultAsync(rr => rr.Id == id);

            if (rating == null)
            {
                return NotFound();
            }

            return rating;
        }

        // GET: api/ratings/driver/{id}
        [HttpGet("driver/{id}")]
        public async Task<ActionResult<DriverRating>> GetDriverRating(int id)
        {
            var rating = await _context.DriverRatings
                .Include(dr => dr.Ride)
                .Include(dr => dr.Driver)
                .Include(dr => dr.Rider)
                .FirstOrDefaultAsync(dr => dr.Id == id);

            if (rating == null)
            {
                return NotFound();
            }

            return rating;
        }

        // GET: api/ratings/driver/{driverId}/average
        [HttpGet("driver/{driverId}/average")]
        public async Task<ActionResult<object>> GetDriverAverageRating(int driverId)
        {
            var ratings = await _context.RiderRatings
                .Where(rr => rr.DriverId == driverId)
                .ToListAsync();

            if (!ratings.Any())
            {
                return Ok(new { averageRating = 0.0, totalRatings = 0 });
            }

            var averageRating = ratings.Average(r => r.Rating);
            var totalRatings = ratings.Count;

            return Ok(new { averageRating = Math.Round(averageRating, 2), totalRatings });
        }

        // GET: api/ratings/rider/{riderId}/average
        [HttpGet("rider/{riderId}/average")]
        public async Task<ActionResult<object>> GetRiderAverageRating(int riderId)
        {
            var ratings = await _context.DriverRatings
                .Where(dr => dr.RiderId == riderId)
                .ToListAsync();

            if (!ratings.Any())
            {
                return Ok(new { averageRating = 0.0, totalRatings = 0 });
            }

            var averageRating = ratings.Average(r => r.Rating);
            var totalRatings = ratings.Count;

            return Ok(new { averageRating = Math.Round(averageRating, 2), totalRatings });
        }

        // GET: api/ratings/driver/{driverId}/all
        [HttpGet("driver/{driverId}/all")]
        public async Task<ActionResult<IEnumerable<RiderRating>>> GetDriverRatings(int driverId)
        {
            var ratings = await _context.RiderRatings
                .Include(rr => rr.Ride)
                .Include(rr => rr.Rider)
                .Where(rr => rr.DriverId == driverId)
                .OrderByDescending(rr => rr.CreatedAt)
                .ToListAsync();

            return ratings;
        }

        // GET: api/ratings/rider/{riderId}/all
        [HttpGet("rider/{riderId}/all")]
        public async Task<ActionResult<IEnumerable<DriverRating>>> GetRiderRatings(int riderId)
        {
            var ratings = await _context.DriverRatings
                .Include(dr => dr.Ride)
                .Include(dr => dr.Driver)
                .Where(dr => dr.RiderId == riderId)
                .OrderByDescending(dr => dr.CreatedAt)
                .ToListAsync();

            return ratings;
        }

        // GET: api/ratings/ride/{rideId}
        [HttpGet("ride/{rideId}")]
        public async Task<ActionResult<object>> GetRideRatings(int rideId)
        {
            var riderRating = await _context.RiderRatings
                .Include(rr => rr.Rider)
                .FirstOrDefaultAsync(rr => rr.RideId == rideId);

            var driverRating = await _context.DriverRatings
                .Include(dr => dr.Driver)
                .FirstOrDefaultAsync(dr => dr.RideId == rideId);

            return Ok(new { riderRating, driverRating });
        }

        private async Task UpdateDriverAverageRating(int driverId)
        {
            var ratings = await _context.RiderRatings
                .Where(rr => rr.DriverId == driverId)
                .ToListAsync();

            if (ratings.Any())
            {
                var averageRating = ratings.Average(r => r.Rating);
                var driver = await _context.Drivers.FindAsync(driverId);
                if (driver != null)
                {
                    driver.AverageRating = (decimal)Math.Round(averageRating, 2);
                    driver.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        private async Task UpdateRiderAverageRating(int riderId)
        {
            var ratings = await _context.DriverRatings
                .Where(dr => dr.RiderId == riderId)
                .ToListAsync();

            if (ratings.Any())
            {
                var averageRating = ratings.Average(r => r.Rating);
                var rider = await _context.Riders.FindAsync(riderId);
                if (rider != null)
                {
                    rider.AverageRating = (decimal)Math.Round(averageRating, 2);
                    rider.UpdatedAt = DateTime.UtcNow;
                }
            }
        }
    }
}
