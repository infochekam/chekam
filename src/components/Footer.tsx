import logo from "@/assets/chekamlogo.png";
import { Mail, MapPin, Phone, Instagram, Linkedin, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <img src={logo} alt="Chekam" className="h-8 brightness-0 invert" />
            <p className="text-sm opacity-70">
              AI-powered property verification for secure, remote real estate decisions.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://x.com/chekam" target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://instagram.com/chekam" target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-opacity">
                <Instagram size={18} />
              </a>
              <a href="https://linkedin.com/company/chekam" target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-opacity">
                <Linkedin size={18} />
              </a>
              <a href="https://wa.me/2349038315695" target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-opacity">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 uppercase tracking-wider opacity-50">
              Product
            </h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><a href="#features" className="hover:opacity-100 transition-opacity">Features</a></li>
              <li><a href="#pricing" className="hover:opacity-100 transition-opacity">Pricing</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">API</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Documentation</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 uppercase tracking-wider opacity-50">
              Company
            </h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><a href="#" className="hover:opacity-100 transition-opacity">About</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Blog</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Careers</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Contact</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 uppercase tracking-wider opacity-50">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-sm opacity-70">
              <li className="flex items-center gap-2">
                <Mail size={14} /> info@chekam.com
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} /> 09038315695
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} /> Lagos, Nigeria
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center text-xs opacity-50">
          © {new Date().getFullYear()} Chekam. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
