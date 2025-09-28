using api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// Add Entity Framework
builder.Services.AddDbContext<RideDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options => 
{ 
    options.AddPolicy("OpenPolicy", builder => 
    { 
        builder.AllowAnyOrigin() 
               .AllowAnyMethod() 
               .AllowAnyHeader(); 
    }); 
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.UseCors("OpenPolicy");

app.MapControllers();

// Ensure database is created and seed data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<RideDbContext>();
    context.Database.EnsureCreated();
    
    // Seed users if none exist
    if (!context.Users.Any())
    {
        var adminUser = new api.Models.User
        {
            Username = "admin",
            Email = "admin@ua.edu",
            Password = "admin123",
            Role = "Admin",
            FirstName = "System",
            LastName = "Administrator",
            PhoneNumber = "205-555-0001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var driverUser1 = new api.Models.User
        {
            Username = "stacy",
            Email = "stacy@ua.edu",
            Password = "driver123",
            Role = "Driver",
            FirstName = "Stacy",
            LastName = "Streets",
            PhoneNumber = "205-555-0002",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var driverUser2 = new api.Models.User
        {
            Username = "sarah",
            Email = "sarah@ua.edu",
            Password = "driver123",
            Role = "Driver",
            FirstName = "Sarah",
            LastName = "Smith",
            PhoneNumber = "205-555-0003",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var riderUser = new api.Models.User
        {
            Username = "rider",
            Email = "rider@ua.edu",
            Password = "rider123",
            Role = "Rider",
            FirstName = "John",
            LastName = "Doe",
            PhoneNumber = "205-555-0004",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(adminUser, driverUser1, driverUser2, riderUser);
        context.SaveChanges();

        // Update drivers with user IDs
        var stacyDriver = context.Drivers.FirstOrDefault(d => d.Name == "Stacy Streets");
        var sarahDriver = context.Drivers.FirstOrDefault(d => d.Name == "Sarah Smith");

        if (stacyDriver != null)
        {
            stacyDriver.UserId = driverUser1.Id;
        }

        if (sarahDriver != null)
        {
            sarahDriver.UserId = driverUser2.Id;
        }

        context.SaveChanges();
    }

    // Seed drivers if none exist
    if (!context.Drivers.Any())
    {
        context.Drivers.AddRange(new[]
        {
            new api.Models.Driver
            {
                Name = "Stacy Streets",
                VehicleId = "SC-001",
                VehicleName = "Solar Golf Cart Alpha",
                Location = "Hewson Hall",
                IsAvailable = true,
                TotalRides = 23,
                AverageTip = 45.20m,
                Rating = 4.9m,
                Status = "Active"
            },
            new api.Models.Driver
            {
                Name = "Sarah Smith",
                VehicleId = "SC-002", 
                VehicleName = "Solar Golf Cart Beta",
                Location = "Presidential Village",
                IsAvailable = true,
                TotalRides = 18,
                AverageTip = 42.15m,
                Rating = 4.8m,
                Status = "Active"
            }
        });
        context.SaveChanges();
    }
}

app.Run();
