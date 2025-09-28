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
        public DbSet<CampusLocation> CampusLocations { get; set; }

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

            modelBuilder.Entity<ChatMessage>()
                .HasOne(c => c.Driver)
                .WithMany()
                .HasForeignKey(c => c.DriverId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ChatMessage>()
                .HasOne(c => c.Rider)
                .WithMany()
                .HasForeignKey(c => c.RiderId)
                .OnDelete(DeleteBehavior.SetNull);

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

            // Seed campus locations data
            modelBuilder.Entity<CampusLocation>().HasData(
                new CampusLocation { Id = 1, Name = "Gorgas Library", Latitude = 33.212118, Longitude = -87.546128, Type = "academic", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 2, Name = "Denny Chimes", Latitude = 33.209717, Longitude = -87.546836, Type = "landmark", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 3, Name = "Bryant-Denny Stadium", Latitude = 33.207301, Longitude = -87.549064, Type = "recreation", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 4, Name = "Ferguson Student Center", Latitude = 33.214950, Longitude = -87.546286, Type = "hub", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 5, Name = "Coleman Coliseum", Latitude = 33.203810, Longitude = -87.539703, Type = "recreation", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 6, Name = "Reese Phifer Hall", Latitude = 33.209827, Longitude = -87.548377, Type = "academic", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 7, Name = "Ten Hoor Hall", Latitude = 33.212642, Longitude = -87.549700, Type = "academic", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 8, Name = "Lloyd Hall", Latitude = 33.211083, Longitude = -87.544275, Type = "academic", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 9, Name = "Smith Hall", Latitude = 33.211929, Longitude = -87.544213, Type = "academic", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 10, Name = "Bidgood Hall", Latitude = 33.211645, Longitude = -87.547811, Type = "academic", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 11, Name = "Russell Hall", Latitude = 33.209751, Longitude = -87.542963, Type = "academic", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 12, Name = "Tutwiler Hall", Latitude = 33.205335, Longitude = -87.549398, Type = "residential", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 13, Name = "Paty Hall", Latitude = 33.216746, Longitude = -87.546687, Type = "residential", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 14, Name = "Ridgecrest South", Latitude = 33.217327, Longitude = -87.549387, Type = "residential", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 15, Name = "Ridgecrest East", Latitude = 33.217187, Longitude = -87.548609, Type = "residential", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 16, Name = "Blount Hall", Latitude = 33.217078, Longitude = -87.548089, Type = "residential", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 17, Name = "Presidential Village", Latitude = 33.219702, Longitude = -87.544141, Type = "residential", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 18, Name = "Riverside", Latitude = 33.219702, Longitude = -87.544141, Type = "residential", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 19, Name = "Lakeside Dining", Latitude = 33.217410, Longitude = -87.545917, Type = "dining", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 20, Name = "Fresh Foods Company", Latitude = 33.212577, Longitude = -87.542908, Type = "dining", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 21, Name = "Student Recreation Center", Latitude = 33.211597, Longitude = -87.531760, Type = "recreation", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 22, Name = "Aquatic Center", Latitude = 33.205571, Longitude = -87.541472, Type = "recreation", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 23, Name = "Hewson Hall", Latitude = 33.212038, Longitude = -87.551336, Type = "academic", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 24, Name = "Bryant Hall", Latitude = 33.211212, Longitude = -87.541341, Type = "residential", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 25, Name = "Little Hall", Latitude = 33.208714, Longitude = -87.545829, Type = "academic", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 26, Name = "Farrah Hall", Latitude = 33.209130, Longitude = -87.544390, Type = "academic", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 27, Name = "Clark Hall", Latitude = 33.212276, Longitude = -87.546541, Type = "academic", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 28, Name = "Gallalee Hall", Latitude = 33.209542, Longitude = -87.544388, Type = "academic", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new CampusLocation { Id = 29, Name = "Burke Dining Hall", Latitude = 33.205335, Longitude = -87.549398, Type = "dining", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        }
    }
}
