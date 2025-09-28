using Microsoft.EntityFrameworkCore;
using api.Models;

namespace api.Data
{
    public class RideDbContext : DbContext
    {
        public RideDbContext(DbContextOptions<RideDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<Rider> Riders { get; set; }
        public DbSet<Ride> Rides { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships
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

            // User relationships
            modelBuilder.Entity<Driver>()
                .HasOne(d => d.User)
                .WithOne(u => u.Driver)
                .HasForeignKey<Driver>(d => d.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Rider>()
                .HasOne(r => r.User)
                .WithOne(u => u.Rider)
                .HasForeignKey<Rider>(r => r.UserId)
                .OnDelete(DeleteBehavior.SetNull);


            // Seed initial data
            modelBuilder.Entity<Driver>().HasData(
                new Driver
                {
                    Id = 1,
                    Name = "Stacy Streets",
                    VehicleId = "GC-001",
                    VehicleName = "Golf Cart Alpha",
                    Location = "Hewson Hall",
                    IsAvailable = true,
                    TotalRides = 23,
                    AverageTip = 45.20m,
                    Rating = 4.9m,
                    Status = "Active",
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Driver
                {
                    Id = 2,
                    Name = "Sarah Smith",
                    VehicleId = "GC-002",
                    VehicleName = "Golf Cart Beta",
                    Location = "Presidential Village",
                    IsAvailable = true,
                    TotalRides = 18,
                    AverageTip = 42.15m,
                    Rating = 4.8m,
                    Status = "Active",
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            // Seed rider data
            modelBuilder.Entity<Rider>().HasData(
                new Rider
                {
                    Id = 1,
                    UserId = 4, // James Wilson
                    Name = "James Wilson",
                    TotalRides = 0,
                    RiderStatus = "New",
                    AverageRating = 0.0m,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        }
    }
}
