BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Denuncia] DROP CONSTRAINT [Denuncia_ID_TipoDe_fkey];

-- AlterTable
ALTER TABLE [dbo].[Denuncia] ADD [observacionDirgegen] NVARCHAR(max);

-- AlterTable
ALTER TABLE [dbo].[Persona] ADD [genero] NVARCHAR(50);

-- RedefineTables
BEGIN TRANSACTION;
DECLARE @SQL NVARCHAR(MAX) = N''
SELECT @SQL += N'ALTER TABLE '
    + QUOTENAME(OBJECT_SCHEMA_NAME(PARENT_OBJECT_ID))
    + '.'
    + QUOTENAME(OBJECT_NAME(PARENT_OBJECT_ID))
    + ' DROP CONSTRAINT '
    + OBJECT_NAME(OBJECT_ID) + ';'
FROM SYS.OBJECTS
WHERE TYPE_DESC LIKE '%CONSTRAINT'
    AND OBJECT_NAME(PARENT_OBJECT_ID) = 'Tipo_Denuncia'
    AND SCHEMA_NAME(SCHEMA_ID) = 'dbo'
EXEC sp_executesql @SQL
;
CREATE TABLE [dbo].[_prisma_new_Tipo_Denuncia] (
    [ID_TipoDe] INT NOT NULL,
    [Nombre] VARCHAR(100) NOT NULL,
    [Area] VARCHAR(100) NOT NULL,
    [Descripcion] VARCHAR(255),
    CONSTRAINT [Tipo_Denuncia_pkey] PRIMARY KEY CLUSTERED ([ID_TipoDe])
);
IF EXISTS(SELECT * FROM [dbo].[Tipo_Denuncia])
    EXEC('INSERT INTO [dbo].[_prisma_new_Tipo_Denuncia] ([Area],[ID_TipoDe],[Nombre]) SELECT [Area],[ID_TipoDe],[Nombre] FROM [dbo].[Tipo_Denuncia] WITH (holdlock tablockx)');
DROP TABLE [dbo].[Tipo_Denuncia];
EXEC SP_RENAME N'dbo._prisma_new_Tipo_Denuncia', N'Tipo_Denuncia';
COMMIT;

-- AddForeignKey
ALTER TABLE [dbo].[Denuncia] ADD CONSTRAINT [Denuncia_ID_TipoDe_fkey] FOREIGN KEY ([ID_TipoDe]) REFERENCES [dbo].[Tipo_Denuncia]([ID_TipoDe]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
