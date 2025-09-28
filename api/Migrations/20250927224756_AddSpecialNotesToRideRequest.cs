using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddSpecialNotesToRideRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Username = table.Column<string>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    Password = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false),
                    FirstName = table.Column<string>(type: "TEXT", nullable: false),
                    LastName = table.Column<string>(type: "TEXT", nullable: false),
                    PhoneNumber = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Drivers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    VehicleId = table.Column<string>(type: "TEXT", nullable: false),
                    VehicleName = table.Column<string>(type: "TEXT", nullable: false),
                    Location = table.Column<string>(type: "TEXT", nullable: false),
                    IsAvailable = table.Column<bool>(type: "INTEGER", nullable: false),
                    BatteryLevel = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalRides = table.Column<int>(type: "INTEGER", nullable: false),
                    AverageTip = table.Column<decimal>(type: "TEXT", nullable: false),
                    Rating = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    CurrentRideId = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Drivers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Drivers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RideRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: true),
                    RiderName = table.Column<string>(type: "TEXT", nullable: false),
                    PickupLocation = table.Column<string>(type: "TEXT", nullable: false),
                    DropoffLocation = table.Column<string>(type: "TEXT", nullable: false),
                    PassengerCount = table.Column<int>(type: "INTEGER", nullable: false),
                    CartSize = table.Column<string>(type: "TEXT", nullable: false),
                    SpecialNotes = table.Column<string>(type: "TEXT", nullable: false),
                    EstimatedFare = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    DeclinedByDrivers = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RideRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RideRequests_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Rides",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RideRequestId = table.Column<int>(type: "INTEGER", nullable: false),
                    DriverId = table.Column<int>(type: "INTEGER", nullable: false),
                    RiderName = table.Column<string>(type: "TEXT", nullable: false),
                    PickupLocation = table.Column<string>(type: "TEXT", nullable: false),
                    DropoffLocation = table.Column<string>(type: "TEXT", nullable: false),
                    PassengerCount = table.Column<int>(type: "INTEGER", nullable: false),
                    CartSize = table.Column<string>(type: "TEXT", nullable: false),
                    SpecialNotes = table.Column<string>(type: "TEXT", nullable: false),
                    EstimatedFare = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    StartTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Distance = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Rides_Drivers_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Drivers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Rides_RideRequests_RideRequestId",
                        column: x => x.RideRequestId,
                        principalTable: "RideRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RideId = table.Column<int>(type: "INTEGER", nullable: false),
                    Sender = table.Column<string>(type: "TEXT", nullable: false),
                    SenderName = table.Column<string>(type: "TEXT", nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Rides_RideId",
                        column: x => x.RideId,
                        principalTable: "Rides",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Drivers",
                columns: new[] { "Id", "AverageTip", "BatteryLevel", "CreatedAt", "CurrentRideId", "IsAvailable", "Location", "Name", "Rating", "Status", "TotalRides", "UpdatedAt", "UserId", "VehicleId", "VehicleName" },
                values: new object[,]
                {
                    { 1, 45.20m, 85, new DateTime(2025, 9, 27, 22, 47, 56, 469, DateTimeKind.Utc).AddTicks(6230), null, true, "Hewson Hall", "Stacy Streets", 4.9m, "Active", 23, new DateTime(2025, 9, 27, 22, 47, 56, 469, DateTimeKind.Utc).AddTicks(6340), null, "SC-001", "Solar Golf Cart Alpha" },
                    { 2, 42.15m, 92, new DateTime(2025, 9, 27, 22, 47, 56, 469, DateTimeKind.Utc).AddTicks(6450), null, true, "Presidential Village", "Sarah Smith", 4.8m, "Active", 18, new DateTime(2025, 9, 27, 22, 47, 56, 469, DateTimeKind.Utc).AddTicks(6450), null, "SC-002", "Solar Golf Cart Beta" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_RideId",
                table: "ChatMessages",
                column: "RideId");

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_UserId",
                table: "Drivers",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RideRequests_UserId",
                table: "RideRequests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Rides_DriverId",
                table: "Rides",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_Rides_RideRequestId",
                table: "Rides",
                column: "RideRequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "Rides");

            migrationBuilder.DropTable(
                name: "Drivers");

            migrationBuilder.DropTable(
                name: "RideRequests");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
