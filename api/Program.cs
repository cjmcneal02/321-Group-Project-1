using api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

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
                BatteryLevel = 85,
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
                BatteryLevel = 92,
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
