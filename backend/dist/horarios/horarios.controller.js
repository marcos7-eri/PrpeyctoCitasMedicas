"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HorariosController = void 0;
const common_1 = require("@nestjs/common");
const horarios_service_1 = require("./horarios.service");
let HorariosController = class HorariosController {
    horariosService;
    constructor(horariosService) {
        this.horariosService = horariosService;
    }
    async findAll(doctorId, diaSemana, activo) {
        return this.horariosService.findAll(doctorId, diaSemana, activo);
    }
    async create(body) {
        return this.horariosService.create(body);
    }
    async update(id, body) {
        return this.horariosService.update(id, body);
    }
    async remove(id) {
        return this.horariosService.remove(id);
    }
};
exports.HorariosController = HorariosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('doctor_id')),
    __param(1, (0, common_1.Query)('dia_semana')),
    __param(2, (0, common_1.Query)('activo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], HorariosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HorariosController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HorariosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HorariosController.prototype, "remove", null);
exports.HorariosController = HorariosController = __decorate([
    (0, common_1.Controller)('horarios'),
    __metadata("design:paramtypes", [horarios_service_1.HorariosService])
], HorariosController);
//# sourceMappingURL=horarios.controller.js.map