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
function MagicLinkEmailTemplate({ magicLink }) {
    return (React.createElement(MainTemplate_1.default, { preview: "Bienvenue sur SaveThePlate!", mainTitle: "Bienvenue sur SaveThePlate! \uD83C\uDF89", description: "Rejoignez-nous pour r\u00E9duire le gaspillage alimentaire et sauver la plan\u00E8te, un repas \u00E0 la fois \uD83C\uDF0D", centeredDescription: true, details: [], buttonText: "Se connecter avec l'email", buttonLink: magicLink, withThank: false, withButton: true }));
}
exports.default = MagicLinkEmailTemplate;
//# sourceMappingURL=MagicLink.js.map