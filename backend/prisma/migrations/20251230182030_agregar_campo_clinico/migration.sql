/*
  Warnings:

  - Added the required column `ID_Denuncia` to the `Archivo` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Archivo] ADD [ID_Denuncia] INT NOT NULL,
[MinIO_Key] VARCHAR(500),
[Nombre_Original] VARCHAR(255),
[Tamaño] BIGINT,
[Tipo_Archivo] VARCHAR(100);

-- AlterTable
ALTER TABLE [dbo].[Denuncia] ADD [Reserva_Identidad] BIT NOT NULL CONSTRAINT [Denuncia_Reserva_Identidad_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[Persona] ADD [Carrera_Cargo] VARCHAR(150);

-- CreateTable
CREATE TABLE [dbo].[Detalle_Campo_Clinico] (
    [ID_Denuncia] INT NOT NULL,
    [Nombre_Establecimiento] VARCHAR(200) NOT NULL,
    [Unidad_Servicio] VARCHAR(200) NOT NULL,
    [Tipo_Vinculacion_Denunciado] VARCHAR(100) NOT NULL,
    CONSTRAINT [Detalle_Campo_Clinico_pkey] PRIMARY KEY CLUSTERED ([ID_Denuncia])
);

-- AddForeignKey
ALTER TABLE [dbo].[Archivo] ADD CONSTRAINT [Archivo_ID_Denuncia_fkey] FOREIGN KEY ([ID_Denuncia]) REFERENCES [dbo].[Denuncia]([ID_Denuncia]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Detalle_Campo_Clinico] ADD CONSTRAINT [Detalle_Campo_Clinico_ID_Denuncia_fkey] FOREIGN KEY ([ID_Denuncia]) REFERENCES [dbo].[Denuncia]([ID_Denuncia]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
