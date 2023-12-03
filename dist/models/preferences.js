"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auto_categories_1 = require("../utils/auto_categories");
const mongoose_1 = require("mongoose");
const preferencesSchema = new mongoose_1.Schema({
    owner: {
        type: String,
        required: true,
        ref: "User"
    },
    preferences: [{
            type: String,
            enum: auto_categories_1.categories,
            default: 'Others'
        }],
}, { timestamps: true });
const Preferences = mongoose_1.models.Preferences || (0, mongoose_1.model)("Preferences", preferencesSchema);
exports.default = Preferences;
