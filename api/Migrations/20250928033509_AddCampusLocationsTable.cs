using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddCampusLocationsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CampusLocations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Latitude = table.Column<double>(type: "REAL", nullable: false),
                    Longitude = table.Column<double>(type: "REAL", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampusLocations", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "CampusLocations",
                columns: new[] { "Id", "CreatedAt", "Latitude", "Longitude", "Name", "Type", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8160), 33.212117999999997, -87.546127999999996, "Gorgas Library", "academic", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8270) },
                    { 2, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8390), 33.209716999999998, -87.546835999999999, "Denny Chimes", "landmark", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8390) },
                    { 3, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8400), 33.207301000000001, -87.549064000000001, "Bryant-Denny Stadium", "recreation", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8400) },
                    { 4, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8400), 33.214950000000002, -87.546285999999995, "Ferguson Student Center", "hub", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8400) },
                    { 5, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8400), 33.203809999999997, -87.539703000000003, "Coleman Coliseum", "recreation", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8400) },
                    { 6, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8400), 33.209826999999997, -87.548377000000002, "Reese Phifer Hall", "academic", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8400) },
                    { 7, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8400), 33.212642000000002, -87.549700000000001, "Ten Hoor Hall", "academic", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8400) },
                    { 8, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8400), 33.211083000000002, -87.544274999999999, "Lloyd Hall", "academic", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8400) },
                    { 9, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8410), 33.211928999999998, -87.544212999999999, "Smith Hall", "academic", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8410) },
                    { 10, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8410), 33.211644999999997, -87.547810999999996, "Bidgood Hall", "academic", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8410) },
                    { 11, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8410), 33.209750999999997, -87.542963, "Russell Hall", "academic", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8410) },
                    { 12, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8410), 33.205334999999998, -87.549397999999997, "Tutwiler Hall", "residential", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8410) },
                    { 13, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8410), 33.216746000000001, -87.546687000000006, "Paty Hall", "residential", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8410) },
                    { 14, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8420), 33.217326999999997, -87.549386999999996, "Ridgecrest South", "residential", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8420) },
                    { 15, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8420), 33.217187000000003, -87.548608999999999, "Ridgecrest East", "residential", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8420) },
                    { 16, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8420), 33.217078000000001, -87.548089000000004, "Blount Hall", "residential", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8420) },
                    { 17, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8420), 33.219701999999998, -87.544140999999996, "Presidential Village", "residential", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8420) },
                    { 18, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8420), 33.219701999999998, -87.544140999999996, "Riverside", "residential", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8420) },
                    { 19, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8420), 33.217410000000001, -87.545917000000003, "Lakeside Dining", "dining", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8420) },
                    { 20, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8430), 33.212577000000003, -87.542907999999997, "Fresh Foods Company", "dining", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8430) },
                    { 21, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8430), 33.211596999999998, -87.531760000000006, "Student Recreation Center", "recreation", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8430) },
                    { 22, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8430), 33.205570999999999, -87.541471999999999, "Aquatic Center", "recreation", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8430) },
                    { 23, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8430), 33.212038, -87.551336000000006, "Hewson Hall", "academic", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8430) },
                    { 24, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8430), 33.211212000000003, -87.541341000000003, "Bryant Hall", "residential", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8430) },
                    { 25, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8430), 33.208714000000001, -87.545828999999998, "Little Hall", "academic", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8430) },
                    { 26, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8440), 33.209130000000002, -87.544390000000007, "Farrah Hall", "academic", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8440) },
                    { 27, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8440), 33.212276000000003, -87.546541000000005, "Clark Hall", "academic", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8440) },
                    { 28, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8440), 33.209541999999999, -87.544387999999998, "Gallalee Hall", "academic", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8440) },
                    { 29, new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8440), 33.205334999999998, -87.549397999999997, "Burke Dining Hall", "dining", new DateTime(2025, 9, 28, 3, 35, 9, 636, DateTimeKind.Utc).AddTicks(8440) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CampusLocations");
        }
    }
}
