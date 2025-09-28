using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateChatMessageWithDriverAndRiderIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DriverId",
                table: "ChatMessages",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RiderId",
                table: "ChatMessages",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_DriverId",
                table: "ChatMessages",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_RiderId",
                table: "ChatMessages",
                column: "RiderId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_Drivers_DriverId",
                table: "ChatMessages",
                column: "DriverId",
                principalTable: "Drivers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_Riders_RiderId",
                table: "ChatMessages",
                column: "RiderId",
                principalTable: "Riders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_Drivers_DriverId",
                table: "ChatMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_Riders_RiderId",
                table: "ChatMessages");

            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_DriverId",
                table: "ChatMessages");

            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_RiderId",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "DriverId",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "RiderId",
                table: "ChatMessages");
        }
    }
}
