import React from "react";

function AppFooter() {
  return (
    <>
      <style>
        {`
          .ssc-footer-social:hover {
            transform: translateY(-3px);
            opacity: 0.9;
          }

          .ssc-footer-sponsor:hover {
            transform: translateY(-2px);
          }

          @media (max-width: 768px) {
            .ssc-footer-container {
              flex-direction: column !important;
              text-align: center !important;
            }

            .ssc-footer-brand {
              justify-content: center !important;
            }

            .ssc-footer-sponsors,
            .ssc-footer-socials {
              justify-content: center !important;
            }

            .ssc-footer-right {
              text-align: center !important;
            }
          }
        `}
      </style>

      <footer style={footerStyle}>
        <div style={containerStyle} className="ssc-footer-container">

          {/* LEFT */}
          <div style={brandSectionStyle} className="ssc-footer-brand">
            <img
              src="/logo-smart-sport-consulting.jpg"
              alt="SSC Logo"
              style={logoStyle}
            />

            <div>
              <h3 style={brandTitleStyle}>Smart Sport Consulting</h3>
              <p style={brandTextStyle}>
                Professional Football Tournament Management Platform
              </p>
            </div>
          </div>

          {/* SPONSORS */}
          <div>
            <p style={sectionTitleStyle}>Official Sponsors</p>

            <div style={sponsorsRowStyle} className="ssc-footer-sponsors">
              <div style={sponsorCardStyle} className="ssc-footer-sponsor">
                <img src="/FIFCO-Logo-top-2.png" style={sponsorLogoStyle} />
              </div>

              <div style={sponsorCardStyle} className="ssc-footer-sponsor">
                <img src="/logo.png" style={sponsorLogoStyle} />
              </div>
            </div>
          </div>

          {/* SOCIAL */}
          <div>
            <p style={sectionTitleStyle}>Follow Us</p>

            <div style={socialRowStyle} className="ssc-footer-socials">

              <a
                href="https://wa.me/212600000000"
                target="_blank"
                rel="noopener noreferrer"
                style={socialButtonStyle}
                className="ssc-footer-social"
              >
                <img src="/icons/whatsapp.svg" style={iconStyle} />
              </a>

              <a
                href="https://www.instagram.com/smartsportconsulting?igsh=Z3JwYzNkaHp1dW1x"
                target="_blank"
                rel="noopener noreferrer"
                style={socialButtonStyle}
                className="ssc-footer-social"
              >
                <img src="/icons/instagram.svg" style={iconStyle} />
              </a>

              <a
                href="https://www.facebook.com/share/18TU1UsUtW/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                style={socialButtonStyle}
                className="ssc-footer-social"
              >
                <img src="/icons/facebook.svg" style={iconStyle} />
              </a>

            </div>
          </div>

          {/* COPYRIGHT */}
          <div style={rightSectionStyle} className="ssc-footer-right">
            <p style={copyTextStyle}>
              © {new Date().getFullYear()} Smart Sport Consulting
              <br />
              All rights reserved
            </p>
          </div>

        </div>
      </footer>
    </>
  );
}

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const footerStyle = {
  background: "linear-gradient(135deg, #1476b6 0%, #109847 65%, #cf2136 100%)",
  color: "#fff",
  marginTop: "40px",
  padding: "28px 20px",
};

const containerStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
  flexWrap: "wrap",
};

const brandSectionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const logoStyle = {
  width: "72px",
  backgroundColor: "#fff",
  borderRadius: "12px",
  padding: "6px",
};

const brandTitleStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: "800",
};

const brandTextStyle = {
  margin: "6px 0 0",
  fontSize: "12px",
};

const sectionTitleStyle = {
  margin: "0 0 10px",
  fontSize: "13px",
  fontWeight: "800",
  textAlign: "center",
};

const sponsorsRowStyle = {
  display: "flex",
  gap: "12px",
};

const sponsorCardStyle = {
  width: "68px",
  height: "68px",
  backgroundColor: "#fff",
  borderRadius: "10px",
  padding: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sponsorLogoStyle = {
  width: "100%",
  objectFit: "contain",
};

const socialRowStyle = {
  display: "flex",
  gap: "10px",
};

const socialButtonStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "0.2s ease",
};

const iconStyle = {
  width: "20px",
  height: "20px",
};

const rightSectionStyle = {
  textAlign: "right",
};

const copyTextStyle = {
  margin: 0,
  fontSize: "12px",
};

export default AppFooter;