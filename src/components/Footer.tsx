import logo from "@/assets/chekamlogo.png";
import { Mail, MapPin, Phone, Twitter, Instagram, Linkedin } from "lucide-react";

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
