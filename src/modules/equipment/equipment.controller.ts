import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type {
    CreateEquipmentBody,
    UpdateEquipmentBody,
    ListEquipmentQuery,
} from './equipment.validation';
import catchAsync from '../../utils/catchAsync';
import equipmentService from './equipment.service';

// ─── Create ───────────────────────────────────────────────────────────────────

const createEquipment = catchAsync(async (req: Request, res: Response) => {
    // Remove after fix
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    const body = req.body as CreateEquipmentBody;
    const file = req.file;

    const result = await equipmentService.createEquipmentIntoDB(body, file);

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Equipment created successfully',
        data: result,
    });
});

// ─── Get All ──────────────────────────────────────────────────────────────────

const getAllEquipments = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListEquipmentQuery;

    const result = await equipmentService.getAllEquipmentsFromDB(query);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Equipments retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});

// ─── Get Single ───────────────────────────────────────────────────────────────

const getSingleEquipment = catchAsync(async (req: Request, res: Response) => {
    const { equipmentId } = req.params;

    const result = await equipmentService.getSingleEquipmentFromDB(equipmentId);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Equipment retrieved successfully',
        data: result,
    });
});

// ─── Update ───────────────────────────────────────────────────────────────────

const updateEquipment = catchAsync(async (req: Request, res: Response) => {
    const { equipmentId } = req.params;
    const body = req.body as UpdateEquipmentBody;
    const file = req.file;

    const result = await equipmentService.updateEquipmentIntoDB(equipmentId, body, file);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Equipment updated successfully',
        data: result,
    });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteEquipment = catchAsync(async (req: Request, res: Response) => {
    const { equipmentId } = req.params;

    await equipmentService.deleteEquipmentFromDB(equipmentId);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Equipment deleted successfully',
        data: null,
    });
});

// ─── Toggle Availability ──────────────────────────────────────────────────────

const toggleAvailability = catchAsync(async (req: Request, res: Response) => {
    const { equipmentId } = req.params;

    const result = await equipmentService.toggleAvailabilityFromDB(equipmentId);

    res.status(StatusCodes.OK).json({
        success: true,
        message: `Equipment is now ${result.is_available ? 'available' : 'unavailable'}`,
        data: result,
    });
});

// ─── Export ───────────────────────────────────────────────────────────────────

const equipmentController = {
    createEquipment,
    getAllEquipments,
    getSingleEquipment,
    updateEquipment,
    deleteEquipment,
    toggleAvailability,
};

export default equipmentController;