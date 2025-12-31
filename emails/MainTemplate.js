"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("@react-email/components");
const React = __importStar(require("react"));
function MainTemplate({ preview = 'Your magic link to access your account', mainTitle = '🎉 Welcome to Save The Plate!', description = 'We are excited to have you join us! Click the button below to log in using your magic link.', centeredDescription = true, details = [], buttonText = 'Access Your Account', buttonLink = '', withThank = true, withButton = true, language = 'en', }) {
    return (React.createElement(components_1.Html, null,
        React.createElement(components_1.Head, null),
        React.createElement(components_1.Preview, null, preview),
        React.createElement(components_1.Body, { style: main },
            React.createElement(components_1.Container, { style: container },
                React.createElement("div", { style: accentBar }),
                React.createElement(components_1.Heading, { style: heading },
                    React.createElement(components_1.Text, { style: headingText }, "SaveThePlate!")),
                React.createElement("div", { style: mainTitleContainer },
                    React.createElement(components_1.Text, { style: mainTitleStyle }, mainTitle)),
                React.createElement("div", { style: contentContainerStyle },
                    React.createElement(components_1.Text, { style: centeredDescription ? centeredParagraph : paragraph }, description),
                    details.map((detail = '', index) => {
                        const emojis = ['🔥', '⚡', '💫', '🚀', '✨', '⭐', '🎯', '💎'];
                        const emoji = emojis[index % emojis.length];
                        return (React.createElement(components_1.Text, { key: index, style: detailStyle },
                            emoji,
                            " ",
                            detail));
                    })),
                withButton && (React.createElement("div", { style: buttonContainerStyle },
                    React.createElement(components_1.Button, { style: buttonStyle, href: buttonLink }, buttonText))),
                withThank && (React.createElement("div", { style: footerContainerStyle },
                    React.createElement(components_1.Text, { style: footerText }, "Si vous n'avez pas demand\u00E9 ce lien, vous pouvez ignorer cet email en toute s\u00E9curit\u00E9."),
                    React.createElement(components_1.Text, { style: footerSmallText }, "Merci de faire partie de la communaut\u00E9 Save The Plate ! \uD83C\uDF31"))),
                !withThank && (React.createElement("div", { style: footerContainerStyle },
                    React.createElement(components_1.Text, { style: footerSmallText }, "Ce lien expire dans 10 minutes \u2764\uFE0F")))))));
}
const main = {
    backgroundColor: '#FFFFFF',
    background: 'linear-gradient(135deg, #FFF8F5 0%, #FFF5F0 30%, #FFFFFF 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: '40px 20px',
};
const container = {
    margin: '0 auto',
    padding: '48px 40px',
    borderRadius: '20px',
    background: '#ffffff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
    maxWidth: '600px',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    border: 'none',
};
const heading = {
    display: 'flex',
    alignItems: 'center !important',
    width: '100%',
    justifyContent: 'center',
    paddingBottom: '0px',
    borderBottom: 'none',
    marginBottom: '32px',
    position: 'relative',
};
const logo = {
    width: '40px',
    height: '40px',
    display: 'block',
    marginRight: '4px',
};
const headingText = {
    fontSize: '36px',
    lineHeight: '44px',
    margin: '0px',
    color: '#2D7A3F',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    textAlign: 'center',
};
const mainTitleContainer = {
    display: 'flex',
    alignItems: 'center !important',
    justifyContent: 'center !important',
    width: '100%',
    marginBottom: '24px',
};
const mainTitleStyle = {
    margin: '0px auto',
    fontSize: '32px',
    lineHeight: '40px',
    color: '#2D7A3F',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: '-0.3px',
    padding: '0 10px',
};
const contentContainerStyle = {
    margin: '24px 0px 32px 0px',
    padding: '0px',
    background: 'transparent',
    borderRadius: '0px',
    border: 'none',
    boxShadow: 'none',
};
const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#1F2937',
    marginBottom: '16px',
};
const centeredParagraph = {
    fontSize: '16px',
    lineHeight: '24px',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: '24px',
    fontWeight: '400',
    letterSpacing: '0px',
};
const detailStyle = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#374151',
    marginBottom: '12px',
    fontWeight: '400',
    paddingLeft: '0px',
};
const buttonContainerStyle = {
    display: 'flex',
    alignItems: 'center !important',
    justifyContent: 'center !important',
    margin: '32px 0px 24px 0px',
};
const buttonStyle = {
    color: '#FFFFFF',
    padding: '14px 32px',
    background: '#FFC09F',
    borderRadius: '12px',
    fontWeight: '700',
    margin: 'auto',
    textDecoration: 'none',
    fontSize: '16px',
    boxShadow: '0 2px 8px rgba(255, 192, 159, 0.3)',
    display: 'inline-block',
    letterSpacing: '0.2px',
    border: 'none',
};
const tankStyle = {
    width: '100%',
    marginTop: '30px',
    paddingTop: '25px',
    borderTop: '2px dashed #E5E7EB',
};
const smallParagraph = {
    fontSize: '15px',
    lineHeight: '22px',
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: '0.1px',
};
const linkContact = {
    color: '#059669',
    textDecoration: 'none',
    fontWeight: '600',
    borderBottom: '1px solid #059669',
    paddingBottom: '1px',
};
const accentBar = {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    height: '0px',
    background: 'transparent',
    borderRadius: '20px 20px 0 0',
};
const footerContainerStyle = {
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: '1px solid #E5E7EB',
    textAlign: 'center',
};
const footerText = {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#6B7280',
    marginBottom: '12px',
    fontWeight: '400',
};
const footerSmallText = {
    fontSize: '13px',
    lineHeight: '18px',
    color: '#9CA3AF',
    marginTop: '8px',
    fontWeight: '400',
};
exports.default = MainTemplate;
//# sourceMappingURL=MainTemplate.js.map