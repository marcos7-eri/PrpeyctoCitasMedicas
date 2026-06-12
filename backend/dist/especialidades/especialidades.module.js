"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EspecialidadesModule = void 0;
const common_1 = require("@nestjs/common");
const especialidades_controller_1 = require("./especialidades.controller");
const especialidades_service_1 = require("./especialidades.service");
let EspecialidadesModule = class EspecialidadesModule {
};
exports.EspecialidadesModule = EspecialidadesModule;
exports.EspecialidadesModule = EspecialidadesModule = __decorate([
    (0, common_1.Module)({
        controllers: [especialidades_controller_1.EspecialidadesController],
        providers: [especialidades_service_1.EspecialidadesService],
    })
], EspecialidadesModule);
//# sourceMappingURL=especialidades.module.js.map