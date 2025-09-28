PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Rides" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Rides" PRIMARY KEY AUTOINCREMENT,
    "RideRequestId" INTEGER NOT NULL,
    "DriverId" INTEGER NOT NULL,
    "RiderName" TEXT NOT NULL,
    "PickupLocation" TEXT NOT NULL,
    "DropoffLocation" TEXT NOT NULL,
    "PassengerCount" INTEGER NOT NULL,
    "CartSize" TEXT NOT NULL,
    "EstimatedFare" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "StartTime" TEXT NOT NULL,
    "EndTime" TEXT NULL,
    "Distance" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL, SpecialNotes TEXT, RiderId INTEGER,
    CONSTRAINT "FK_Rides_Drivers_DriverId" FOREIGN KEY ("DriverId") REFERENCES "Drivers" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Rides_RideRequests_RideRequestId" FOREIGN KEY ("RideRequestId") REFERENCES "RideRequests" ("Id") ON DELETE CASCADE
);
INSERT INTO Rides VALUES(8,1,2,'James Wilson','Presidential Village','Ferguson Center',2,'Small','14.0','Completed','2025-09-26 01:44:42','2025-09-26 12:59:42',0,'2025-09-26 00:44:42','2025-09-26 00:44:42','',1);
INSERT INTO Rides VALUES(9,2,1,'James Wilson','Gorgas Library','Student Recreation Center',1,'Small','7.0','Completed','2025-09-27 02:44:44','2025-09-27 02:56:44',0,'2025-09-27 00:44:44','2025-09-27 00:44:44','',1);
COMMIT;
