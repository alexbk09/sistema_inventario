
import { MapPin, Mail, Phone } from 'lucide-react'

export default function LocationContact() {
  return (
    <section className="py-16 bg-muted/30 rounded-2xl px-6 my-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Ubicación */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-8 h-8 text-primary" />
            <h3 className="text-2xl font-bold text-foreground">Ubicación</h3>
          </div>
          <div className="bg-white rounded-lg overflow-hidden h-64 shadow-md">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.6718521903447!2d-75.5304836!3d6.2093!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e4429e09c13c759%3A0xe8f6b3a2c3b4d5e6!2sMedell%C3%ADn%2C%20Antioquia!5e0!3m2!1ses!2sco!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

        {/* Contacto */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-8 h-8 text-primary" />
            <h3 className="text-2xl font-bold text-foreground">Contacto</h3>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <a
                    href="mailto:contacto@tienda.com"
                    className="text-foreground font-medium hover:text-primary transition"
                  >
                    contacto@tienda.com
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Teléfono</p>
                  <a
                    href="tel:+584124000000"
                    className="text-foreground font-medium hover:text-primary transition"
                  >
                    +58 412-4000000
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-sm text-muted-foreground mb-2">Horario de atención</p>
              <p className="text-foreground font-medium">Lunes a Viernes: 9:00 - 18:00</p>
              <p className="text-foreground font-medium">Sábado: 10:00 - 14:00</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
