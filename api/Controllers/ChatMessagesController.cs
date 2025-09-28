using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatMessagesController : ControllerBase
    {
        private readonly RideDbContext _context;

        public ChatMessagesController(RideDbContext context)
        {
            _context = context;
        }

        // GET: api/chatmessages/{rideId}
        [HttpGet("{rideId}")]
        public async Task<ActionResult<IEnumerable<ChatMessage>>> GetChatMessages(int rideId)
        {
            return await _context.ChatMessages
                .Where(c => c.RideId == rideId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
        }

        // POST: api/chatmessages
        [HttpPost]
        public async Task<ActionResult<ChatMessage>> SendMessage(SendMessageDto dto)
        {
            // Verify the ride exists
            var ride = await _context.Rides.FindAsync(dto.RideId);
            if (ride == null)
            {
                return NotFound("Ride not found");
            }

            var message = new ChatMessage
            {
                RideId = dto.RideId,
                DriverId = dto.DriverId,
                RiderId = dto.RiderId,
                Sender = dto.Sender,
                SenderName = dto.SenderName,
                Content = dto.Content,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetChatMessages), new { rideId = dto.RideId }, message);
        }

        // DELETE: api/chatmessages/{rideId}
        [HttpDelete("{rideId}")]
        public async Task<IActionResult> ClearChatMessages(int rideId)
        {
            var messages = await _context.ChatMessages
                .Where(c => c.RideId == rideId)
                .ToListAsync();

            if (messages.Any())
            {
                _context.ChatMessages.RemoveRange(messages);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }
    }
}
