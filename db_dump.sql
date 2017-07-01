CREATE TABLE [dbo].[BuildVersion]
(
  [SystemInformationID] [tinyint] IDENTITY(1,1) NOT NULL,
  [Database Version] [nvarchar](25)  NOT NULL,
  [VersionDate] [datetime]  NOT NULL,
  [ModifiedDate] [datetime]  NOT NULL DEFAULT (getdate())
)
ALTER TABLE [dbo].[BuildVersion] ADD CONSTRAINT PK__BuildVer__35E58ECAB993C89E PRIMARY KEY  ([SystemInformationID])

-- Add 1 rows for BuildVersion.
SET IDENTITY_INSERT BuildVersion ON
INSERT INTO BuildVersion (SystemInformationID, Database Version, VersionDate, ModifiedDate) VALUES 
(1,'10.50.91013.00',2009-10-13 00:00:00 +0000,2009-10-13 00:00:00 +0000);

SET IDENTITY_INSERT BuildVersion OFF

CREATE TABLE [dbo].[cards]
(
  [card_id] [int]  NOT NULL,
  [cardNumber] [varchar](MAX)  NULL,
  [apiKey] [varchar](MAX)  NULL
)
ALTER TABLE [dbo].[cards] ADD CONSTRAINT PK__cards__4D5BC4B1B830B144 PRIMARY KEY  ([card_id])

-- Add 2 rows for cards.
INSERT INTO cards (card_id, cardNumber, apiKey) VALUES 
(1,'1234-5678-9012-3456','fake-api-key'),
(2,'0000-0000-0000-0000','secret-api-key');

CREATE TABLE [dbo].[ErrorLog]
(
  [ErrorLogID] [int] IDENTITY(1,1) NOT NULL,
  [ErrorTime] [datetime]  NOT NULL DEFAULT (getdate()),
  [UserName] [nvarchar](128)  NOT NULL,
  [ErrorNumber] [int]  NOT NULL,
  [ErrorSeverity] [int]  NULL,
  [ErrorState] [int]  NULL,
  [ErrorProcedure] [nvarchar](126)  NULL,
  [ErrorLine] [int]  NULL,
  [ErrorMessage] [nvarchar](4000)  NOT NULL
)
ALTER TABLE [dbo].[ErrorLog] ADD CONSTRAINT PK_ErrorLog_ErrorLogID PRIMARY KEY  ([ErrorLogID])

-- Add 0 rows for ErrorLog.
CREATE TABLE [dbo].[purchases]
(
  [purchases_id] [int]  NOT NULL,
  [amount] [money]  NOT NULL,
  [date] [date]  NOT NULL,
  [card_id] [int]  NOT NULL
)
ALTER TABLE [dbo].[purchases] ADD CONSTRAINT PK__purchase__7A2384A97EABC596 PRIMARY KEY  ([purchases_id])

-- Add 5 rows for purchases.
INSERT INTO purchases (purchases_id, amount, date, card_id) VALUES 
(1,24.99,2017-06-15 00:00:00 +0000,1),
(2,5.99,2017-06-17 00:00:00 +0000,1),
(3,8,2017-06-16 00:00:00 +0000,2),
(4,29,2017-06-18 00:00:00 +0000,2),
(5,0.99,2017-06-18 00:00:00 +0000,2);

