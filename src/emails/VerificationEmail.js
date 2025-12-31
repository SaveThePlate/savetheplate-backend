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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const MainTemplate_1 = __importDefault(require("./MainTemplate"));
function VerificationEmailTemplate({ verificationLink, verificationCode }) {
    const details = [
        "Une fois votre email vérifié, vous pourrez profiter de toutes les fonctionnalités de SaveThePlate",
    ];
    if (verificationCode) {
        details.unshift(`Votre code de vérification est: ${verificationCode}`);
    }
    return (React.createElement(MainTemplate_1.default, { preview: "V\u00E9rifiez votre adresse email", mainTitle: "V\u00E9rifiez votre adresse email \uD83D\uDCE7", description: "Merci de vous \u00EAtre inscrit sur SaveThePlate! Utilisez le code ci-dessous ou cliquez sur le bouton pour v\u00E9rifier votre adresse email et activer votre compte.", centeredDescription: true, details: details, buttonText: "V\u00E9rifier mon email", buttonLink: verificationLink, withThank: false, withButton: true }));
}
exports.default = VerificationEmailTemplate;
//# sourceMappingURL=VerificationEmail.js.map