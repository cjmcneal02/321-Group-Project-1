using Microsoft.EntityFrameworkCore;
using api.Models;

namespace api.Data
{
    public class RideDbContext : DbContext
    {
        public RideDbContext(DbContextOptions<RideDbContext> options) : base(options)
        {
        }

        public DbSet<Driver> Drivers { get; set; }
        public DbSet<RideRequest> RideRequests { get; set; }
        public DbSet<Ride> Rides { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships
            modelBuilder.Entity<Ride>()
                .HasOne(r => r.RideRequest)
                .WithMany()
                .HasForeignKey(r => r.RideRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Ride>()
                .HasOne(r => r.Driver)
                .WithMany()
                .HasForeignKey(r => r.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatMessage>()
                .HasOne(c => c.Ride)
                .WithMany()
                .HasForeignKey(c => c.RideId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed initial data
            modelBuilder.Entity<Driver>().HasData(
                new Driver
                {
                    Id = 1,
                    Name = "Stacy Streets",
                    VehicleId = "SC-001",
                    VehicleName = "Solar Golf Cart Alpha",
                    Location = "Hewson Hall",
                    IsAvailable = true,
                    BatteryLevel = 85,
                    TotalRides = 23,
                    AverageTip = 45.20m,
                    Rating = 4.9m,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Driver
                {
                    Id = 2,
                    Name = "Sarah Smith",
                    VehicleId = "SC-002",
                    VehicleName = "Solar Golf Cart Beta",
                    Location = "Presidential Village",
                    IsAvailable = true,
                    BatteryLevel = 92,
                    TotalRides = 18,
                    AverageTip = 42.15m,
                    Rating = 4.8m,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );
        }
    }
}
