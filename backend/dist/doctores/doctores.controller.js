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
exports.DoctoresController = void 0;
const common_1 = require("@nestjs/common");
const doctores_service_1 = require("./doctores.service");
let DoctoresController = class DoctoresController {
    doctoresService;
    constructor(doctoresService) {
        this.doctoresService = doctoresService;
    }
    async findAll(perfilId) {
        return this.doctoresService.findAll(perfilId);
    }
    async create(body) {
        return this.doctoresService.create(body);
    }
    async update(id, body) {
        return this.doctoresService.update(id, body);
    }
    async remove(id) {
        return this.doctoresService.remove(id);
    }
};
exports.DoctoresController = DoctoresController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('perfil_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DoctoresController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DoctoresController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DoctoresController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DoctoresController.prototype, "remove", null);
exports.DoctoresController = DoctoresController = __decorate([
    (0, common_1.Controller)('doctores'),
    __metadata("design:paramtypes", [doctores_service_1.DoctoresService])
], DoctoresController);
//# sourceMappingURL=doctores.controller.js.map