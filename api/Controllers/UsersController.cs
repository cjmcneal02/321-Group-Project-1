using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly RideDbContext _context;

        public UsersController(RideDbContext context)
        {
            _context = context;
        }

        // GET: api/users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users
                .Include(u => u.Driver)
                .Where(u => u.IsActive)
                .ToListAsync();
        }

        // GET: api/users/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Driver)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound();
            }

            return user;
        }

        // GET: api/users/role/{role}
        [HttpGet("role/{role}")]
        public async Task<ActionResult<IEnumerable<User>>> GetUsersByRole(string role)
        {
            var users = await _context.Users
                .Include(u => u.Driver)
                .Where(u => u.Role == role && u.IsActive)
                .ToListAsync();

            return users;
        }

        // POST: api/users
        [HttpPost]
        public async Task<ActionResult<User>> CreateUser(CreateUserDto dto)
        {
            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
            {
                return BadRequest("Username already exists");
            }

            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest("Email already exists");
            }

            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                Password = dto.Password, // In production, hash this
                Role = dto.Role,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                PhoneNumber = dto.PhoneNumber,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create corresponding profile based on role
            if (dto.Role == "Rider")
            {
                var rider = new Rider
                {
                    UserId = user.Id,
                    Name = $"{user.FirstName} {user.LastName}",
                    TotalRides = 0,
                    RiderStatus = "New",
                    AverageRating = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Riders.Add(rider);
                await _context.SaveChangesAsync();
            }
            else if (dto.Role == "Driver")
            {
                var driver = new Driver
                {
                    UserId = user.Id,
                    Name = $"{user.FirstName} {user.LastName}",
                    VehicleId = $"GC-{user.Id:D3}", // Generate unique vehicle ID
                    VehicleName = $"Golf Cart {user.FirstName}",
                    Location = "Campus Center",
                    IsAvailable = true,
                    TotalRides = 0,
                    AverageTip = 0,
                    AverageRating = 0,
                    Status = "Available",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Drivers.Add(driver);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        // PUT: api/users/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Check if username already exists (excluding current user)
            if (!string.IsNullOrEmpty(dto.Username) && dto.Username != user.Username)
            {
                if (await _context.Users.AnyAsync(u => u.Username == dto.Username && u.Id != id))
                {
                    return BadRequest("Username already exists");
                }
                user.Username = dto.Username;
            }

            // Check if email already exists (excluding current user)
            if (!string.IsNullOrEmpty(dto.Email) && dto.Email != user.Email)
            {
                if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
                {
                    return BadRequest("Email already exists");
                }
                user.Email = dto.Email;
            }

            if (!string.IsNullOrEmpty(dto.Password))
            {
                user.Password = dto.Password; // In production, hash this
            }

            if (!string.IsNullOrEmpty(dto.Role))
            {
                user.Role = dto.Role;
            }

            if (!string.IsNullOrEmpty(dto.FirstName))
            {
                user.FirstName = dto.FirstName;
            }

            if (!string.IsNullOrEmpty(dto.LastName))
            {
                user.LastName = dto.LastName;
            }

            if (!string.IsNullOrEmpty(dto.PhoneNumber))
            {
                user.PhoneNumber = dto.PhoneNumber;
            }

            if (dto.IsActive.HasValue)
            {
                user.IsActive = dto.IsActive.Value;
            }

            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(user);
        }

        // DELETE: api/users/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Soft delete - just mark as inactive
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deactivated successfully" });
        }

        // POST: api/users/login
        [HttpPost("login")]
        public async Task<ActionResult<User>> Login(LoginDto dto)
        {
            var user = await _context.Users
                .Include(u => u.Driver)
                .FirstOrDefaultAsync(u => u.Username == dto.Username && u.Password == dto.Password && u.IsActive);

            if (user == null)
            {
                return Unauthorized("Invalid username or password");
            }

            return Ok(user);
        }
    }
}
