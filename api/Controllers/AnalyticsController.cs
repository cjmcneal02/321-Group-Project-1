using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly RideDbContext _context;

        public AnalyticsController(RideDbContext context)
        {
            _context = context;
        }

        // GET: api/analytics/rider-ratings
        [HttpGet("rider-ratings")]
        public async Task<ActionResult<object>> GetRiderRatingAnalytics()
        {
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;

            // Get all rider ratings from the current month
            var riderRatings = await _context.DriverRatings
                .Include(r => r.Rider)
                .Where(r => r.CreatedAt.Month == currentMonth && r.CreatedAt.Year == currentYear)
                .ToListAsync();

            if (!riderRatings.Any())
            {
                return Ok(new
                {
                    month = $"{currentYear}-{currentMonth:D2}",
                    totalRatings = 0,
                    averageRating = 0.0,
                    ratingDistribution = new { one = 0, two = 0, three = 0, four = 0, five = 0 },
                    topRiders = new List<object>(),
                    recentRatings = new List<object>()
                });
            }

            // Calculate statistics
            var totalRatings = riderRatings.Count;
            var averageRating = Math.Round(riderRatings.Average(r => r.Rating), 2);

            // Rating distribution
            var ratingDistribution = new
            {
                one = riderRatings.Count(r => r.Rating == 1),
                two = riderRatings.Count(r => r.Rating == 2),
                three = riderRatings.Count(r => r.Rating == 3),
                four = riderRatings.Count(r => r.Rating == 4),
                five = riderRatings.Count(r => r.Rating == 5)
            };

            // Top riders by average rating (all riders with at least 1 rating)
            var topRiders = riderRatings
                .GroupBy(r => r.RiderId)
                .Select(g => new
                {
                    riderId = g.Key,
                    riderName = g.First().Rider?.Name ?? "Unknown",
                    averageRating = Math.Round(g.Average(r => r.Rating), 2),
                    totalRatings = g.Count()
                })
                .OrderByDescending(r => r.averageRating)
                .ThenByDescending(r => r.totalRatings)
                .ToList();

            // Recent ratings
            var recentRatings = riderRatings
                .OrderByDescending(r => r.CreatedAt)
                .Take(10)
                .Select(r => new
                {
                    id = r.Id,
                    riderName = r.Rider?.Name ?? "Unknown",
                    rating = r.Rating,
                    comments = r.Comments,
                    createdAt = r.CreatedAt
                })
                .ToList();

            return Ok(new
            {
                month = $"{currentYear}-{currentMonth:D2}",
                totalRatings,
                averageRating,
                ratingDistribution,
                topRiders,
                recentRatings
            });
        }

        // GET: api/analytics/driver-ratings
        [HttpGet("driver-ratings")]
        public async Task<ActionResult<object>> GetDriverRatingAnalytics()
        {
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;

            // Get all driver ratings from the current month
            var driverRatings = await _context.RiderRatings
                .Include(r => r.Driver)
                .Where(r => r.CreatedAt.Month == currentMonth && r.CreatedAt.Year == currentYear)
                .ToListAsync();

            if (!driverRatings.Any())
            {
                return Ok(new
                {
                    month = $"{currentYear}-{currentMonth:D2}",
                    totalRatings = 0,
                    averageRating = 0.0,
                    ratingDistribution = new { one = 0, two = 0, three = 0, four = 0, five = 0 },
                    topDrivers = new List<object>(),
                    recentRatings = new List<object>()
                });
            }

            // Calculate statistics
            var totalRatings = driverRatings.Count;
            var averageRating = Math.Round(driverRatings.Average(r => r.Rating), 2);

            // Rating distribution
            var ratingDistribution = new
            {
                one = driverRatings.Count(r => r.Rating == 1),
                two = driverRatings.Count(r => r.Rating == 2),
                three = driverRatings.Count(r => r.Rating == 3),
                four = driverRatings.Count(r => r.Rating == 4),
                five = driverRatings.Count(r => r.Rating == 5)
            };

            // Top drivers by average rating (all drivers with at least 1 rating)
            var topDrivers = driverRatings
                .GroupBy(r => r.DriverId)
                .Select(g => new
                {
                    driverId = g.Key,
                    driverName = g.First().Driver?.Name ?? "Unknown",
                    averageRating = Math.Round(g.Average(r => r.Rating), 2),
                    totalRatings = g.Count()
                })
                .OrderByDescending(r => r.averageRating)
                .ThenByDescending(r => r.totalRatings)
                .ToList();

            // Recent ratings
            var recentRatings = driverRatings
                .OrderByDescending(r => r.CreatedAt)
                .Take(10)
                .Select(r => new
                {
                    id = r.Id,
                    driverName = r.Driver?.Name ?? "Unknown",
                    rating = r.Rating,
                    comments = r.Comments,
                    createdAt = r.CreatedAt
                })
                .ToList();

            return Ok(new
            {
                month = $"{currentYear}-{currentMonth:D2}",
                totalRatings,
                averageRating,
                ratingDistribution,
                topDrivers,
                recentRatings
            });
        }

        // GET: api/analytics/rating-summary
        [HttpGet("rating-summary")]
        public async Task<ActionResult<object>> GetRatingSummary()
        {
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;

            // Get all ratings from the current month
            var riderRatings = await _context.DriverRatings
                .Where(r => r.CreatedAt.Month == currentMonth && r.CreatedAt.Year == currentYear)
                .ToListAsync();

            var driverRatings = await _context.RiderRatings
                .Where(r => r.CreatedAt.Month == currentMonth && r.CreatedAt.Year == currentYear)
                .ToListAsync();

            var totalRiderRatings = riderRatings.Count;
            var totalDriverRatings = driverRatings.Count;
            var averageRiderRating = riderRatings.Any() ? Math.Round(riderRatings.Average(r => r.Rating), 2) : 0.0;
            var averageDriverRating = driverRatings.Any() ? Math.Round(driverRatings.Average(r => r.Rating), 2) : 0.0;

            return Ok(new
            {
                month = $"{currentYear}-{currentMonth:D2}",
                riderRatings = new
                {
                    total = totalRiderRatings,
                    average = averageRiderRating
                },
                driverRatings = new
                {
                    total = totalDriverRatings,
                    average = averageDriverRating
                },
                overallAverage = totalRiderRatings + totalDriverRatings > 0 
                    ? Math.Round((averageRiderRating * totalRiderRatings + averageDriverRating * totalDriverRatings) / (totalRiderRatings + totalDriverRatings), 2)
                    : 0.0
            });
        }
    }
}
