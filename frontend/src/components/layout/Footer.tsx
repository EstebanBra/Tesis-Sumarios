import React from "react";
import {
  FaFacebook,
  FaInstagram,
  FaXTwitter,
  FaLinkedin,
  FaYoutube,
} from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-[#1C405F] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-3">
        {/* Contacto */}
        <div>
          <h2 className="font-condensed text-lg font-bold text-white/80 hover:text-white">
            Contacto
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-white/80 hover:text-white">
            <li>Universidad del Bío-Bío</li>
            <li>Concepción: Avda. Collao 1202. Fono: +56-413111200</li>
            <li>Chillán: Avda. Andrés Bello 720. Fono: +56-422463000</li>
            <li>
              Email:{" "}
              <a
                href="mailto:ubb@ubiobio.cl"
                className="text-white hover:underline"
              >
                ubb@ubiobio.cl
              </a>
            </li>
            <li>
              Teléfono:{" "}
              <a
                href="tel:+56412345678"
                className="text-ubb-blue hover:underline"
              >
                +56 41 234 5678
              </a>
            </li>
          </ul>
        </div>

        {/* Redes (placeholders) */}
        <div>
          <h2 className="font-condensed text-lg font-bold">Redes sociales</h2>
          <ul className="mt-3 flex items-center gap-3">
            <li>
              <a
                href="https://www.facebook.com/ubiobio"
                aria-label="Facebook UBB"
                className="btn-icon-redes btn-icon--md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebook className="h-5 w-5" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/ubiobio/"
                aria-label="Instagram UBB"
                className="btn-icon-redes btn-icon--md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram className="h-5 w-5" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href="https://x.com/ubbchile"
                aria-label="X (Twitter) UBB"
                className="btn-icon-redes btn-icon--md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaXTwitter className="h-5 w-5" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href="https://www.linkedin.com/school/ubiobio/"
                aria-label="LinkedIn UBB"
                className="btn-icon-redes btn-icon--md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin className="h-5 w-5" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/@UBBTVCHILE"
                aria-label="YouTube UBB"
                className="btn-icon-redes btn-icon--md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaYoutube className="h-5 w-5" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </div>

        {/* Sello CNA */}
        <div className="md:ml-auto">
          <h2 className="font-condensed text-lg font-bold text-white/80 hover:text-white">
            Acreditación CNA
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <img
              src="/sello/sello-cna-blanco.png"
              alt="Sello de Acreditación CNA"
              className="h-15 w-auto"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-white">
          <span>
            © {new Date().getFullYear()} Universidad del Bío-Bío. Todos los
            derechos reservados.
          </span>
        </div>
      </div>
    </footer>
  );
}
