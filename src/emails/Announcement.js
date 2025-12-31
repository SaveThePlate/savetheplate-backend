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
function AnnouncementEmailTemplate({ title = '🎉 Exciting News from Save The Plate!', description = 'We have some amazing updates to share with you!', details = [], buttonText = 'Create Account Now', buttonLink = 'https://leftover.ccdev.space/', language = 'en', }) {
    return (React.createElement(MainTemplate_1.default, { preview: title, mainTitle: title, description: description, centeredDescription: true, details: details, buttonText: buttonText, buttonLink: buttonLink, withThank: false, withButton: buttonLink ? true : false, language: language }));
}
exports.default = AnnouncementEmailTemplate;
//# sourceMappingURL=Announcement.js.map