import  NavLayaout   from '@/Layouts/Nav';
import  FooterLayaout   from '@/Layouts/Footer';
import { usePage } from '@inertiajs/react';

function WhatsAppButton() {
  const { props } = usePage();
  const general = props.settings?.general || {};
  const phone = general.whatsapp || '584120000000';
  const phoneDigits = phone.replace(/[^0-9]/g, '');
  return (
    <a
      href={`https://wa.me/${phoneDigits}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600"
      aria-label="WhatsApp"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M20.52 3.48A11.85 11.85 0 0 0 12 .75C5.7.75.75 5.7.75 12c0 2 .54 3.93 1.57 5.64L1 23l5.5-1.44A11.2 11.2 0 0 0 12 23.25c6.3 0 11.25-4.95 11.25-11.25 0-2.91-1.15-5.65-3.23-7.52ZM12 21a9.02 9.02 0 0 1-4.6-1.26l-.33-.2-3.25.85.87-3.16-.22-.33A9.06 9.06 0 1 1 21 12 9 9 0 0 1 12 21Zm5.24-6.83c-.29-.14-1.7-.84-1.96-.93-.26-.1-.46-.14-.66.14-.2.29-.76.93-.93 1.12-.17.2-.34.22-.63.08-.29-.14-1.25-.46-2.38-1.47-.88-.78-1.47-1.74-1.64-2.03-.17-.29-.02-.45.12-.59.12-.12.29-.31.41-.45.14-.14.2-.24.31-.41.1-.17.05-.31-.02-.45-.08-.14-.66-1.58-.91-2.2-.24-.58-.49-.5-.66-.5-.17 0-.36-.02-.55-.02-.2 0-.45.05-.68.31-.23.26-.89.87-.89 2.12 0 1.24.9 2.45 1.03 2.62.14.17 1.76 2.69 4.26 3.74 1.6.68 2.23.77 3.03.65.49-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.06-.12-.26-.2-.55-.34Z" />
      </svg>
    </a>
  );
}

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col  w-full">
            <NavLayaout />
                <main className="lg:mx-28 md:mx-16 flex-1 px-4 py-6">
                    {children}
                </main>
            <WhatsAppButton />
            <FooterLayaout />
        </div>
    );
}
