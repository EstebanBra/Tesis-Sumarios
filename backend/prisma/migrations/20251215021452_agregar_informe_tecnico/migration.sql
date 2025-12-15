BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[InformeTecnico] (
    [ID_Informe] INT NOT NULL IDENTITY(1,1),
    [ID_Denuncia] INT NOT NULL,
    [ID_Autor] INT NOT NULL,
    [Fecha_Emision] DATETIME2 NOT NULL CONSTRAINT [InformeTecnico_Fecha_Emision_df] DEFAULT CURRENT_TIMESTAMP,
    [Antecedentes] TEXT NOT NULL,
    [Analisis_Social] TEXT NOT NULL,
    [Analisis_Psico] TEXT NOT NULL,
    [Analisis_Juridico] TEXT NOT NULL,
    [Sugerencias] TEXT NOT NULL,
    [Es_Confidencial] BIT NOT NULL CONSTRAINT [InformeTecnico_Es_Confidencial_df] DEFAULT 1,
    CONSTRAINT [InformeTecnico_pkey] PRIMARY KEY CLUSTERED ([ID_Informe]),
    CONSTRAINT [InformeTecnico_ID_Denuncia_key] UNIQUE NONCLUSTERED ([ID_Denuncia])
);

-- AddForeignKey
ALTER TABLE [dbo].[InformeTecnico] ADD CONSTRAINT [InformeTecnico_ID_Denuncia_fkey] FOREIGN KEY ([ID_Denuncia]) REFERENCES [dbo].[Denuncia]([ID_Denuncia]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[InformeTecnico] ADD CONSTRAINT [InformeTecnico_ID_Autor_fkey] FOREIGN KEY ([ID_Autor]) REFERENCES [dbo].[Persona]([ID]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
