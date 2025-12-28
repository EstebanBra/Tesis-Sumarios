BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Notificacion] (
    [ID_Notificacion] INT NOT NULL IDENTITY(1,1),
    [ID_Usuario] INT NOT NULL,
    [Tipo] VARCHAR(50) NOT NULL,
    [Titulo] VARCHAR(200) NOT NULL,
    [Mensaje] TEXT NOT NULL,
    [Leida] BIT NOT NULL CONSTRAINT [Notificacion_Leida_df] DEFAULT 0,
    [Fecha_Creacion] DATETIME2 NOT NULL CONSTRAINT [Notificacion_Fecha_Creacion_df] DEFAULT CURRENT_TIMESTAMP,
    [ID_Denuncia] INT,
    [Enviado_Email] BIT NOT NULL CONSTRAINT [Notificacion_Enviado_Email_df] DEFAULT 0,
    CONSTRAINT [Notificacion_pkey] PRIMARY KEY CLUSTERED ([ID_Notificacion])
);

-- AddForeignKey
ALTER TABLE [dbo].[Notificacion] ADD CONSTRAINT [Notificacion_ID_Usuario_fkey] FOREIGN KEY ([ID_Usuario]) REFERENCES [dbo].[Persona]([ID]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Notificacion] ADD CONSTRAINT [Notificacion_ID_Denuncia_fkey] FOREIGN KEY ([ID_Denuncia]) REFERENCES [dbo].[Denuncia]([ID_Denuncia]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
