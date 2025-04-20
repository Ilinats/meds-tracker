import { PrismaClient } from '../../generated/test/client';
import { getExpiringMedicines, getLowStockMedicines } from '../../modules/scheduler/controllers/scheduleController';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

const mockRequest = (query: any = {}, user: any = null): AuthRequest => ({
  query,
  user: user ? { id: user.id } : undefined,
} as AuthRequest);

const mockResponse = (): Response => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('Medicine Alert Controller', () => {
  let testUser: any;
  let expiringMedicine: any;

  beforeAll(async () => {
    await prisma.medicineTaken.deleteMany();
    await prisma.medicineSchedule.deleteMany();
    await prisma.userMedicine.deleteMany();
    await prisma.presetMedicine.deleteMany();
    await prisma.user.deleteMany();

    testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        password: 'testpassword',
      },
    });
  });

  beforeEach(async () => {
    await prisma.medicineTaken.deleteMany();
    await prisma.medicineSchedule.deleteMany();
    await prisma.userMedicine.deleteMany();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    expiringMedicine = await prisma.userMedicine.create({
      data: {
        name: 'Expiring Medicine',
        category: 'Test',
        unit: 'PILLS',
        quantity: 10,
        expiryDate: tomorrow,
        userId: testUser.id,
      },
    });
  });

  afterEach(async () => {
    await prisma.medicineTaken.deleteMany();
    await prisma.medicineSchedule.deleteMany();
    await prisma.userMedicine.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('getExpiringMedicines', () => {
    it('should return medicines expiring within 7 days', async () => {
      const req = mockRequest({}, testUser);
      const res = mockResponse();

      await getExpiringMedicines(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.length).toBe(1);
      expect(responseData.data[0].id).toBe(expiringMedicine.id);
    });

    it('should return empty array if no medicines are expiring soon', async () => {
      const otherUser = await prisma.user.create({
        data: {
          username: 'otheruser',
          password: 'otherpassword',
        },
      });

      const req = mockRequest({}, otherUser);
      const res = mockResponse();

      await getExpiringMedicines(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.length).toBe(0);
      
      await prisma.userMedicine.deleteMany({ where: { userId: otherUser.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should return error if user is not authenticated', async () => {
      const req = mockRequest({}); // No user
      const res = mockResponse();

      await getExpiringMedicines(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Unable to fetch expiring medicines' },
      });
    });

    it('should order results by expiry date (ascending)', async () => {
      const now = new Date();
      const inThreeDays = new Date(now);
      inThreeDays.setDate(inThreeDays.getDate() + 3);

      const soonestExpiring = await prisma.userMedicine.create({
        data: {
          name: 'Soonest Expiring',
          category: 'Test',
          unit: 'PILLS',
          quantity: 5,
          expiryDate: inThreeDays,
          userId: testUser.id,
        },
      });

      const req = mockRequest({}, testUser);
      const res = mockResponse();

      await getExpiringMedicines(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData.data.length).toBe(2);
      expect(responseData.data[0].id).toBe(expiringMedicine.id);
      expect(responseData.data[1].id).toBe(soonestExpiring.id);
    });
  });

  describe('getLowStockMedicines', () => {
    beforeEach(async () => {
      await prisma.userMedicine.deleteMany();
    });

    it('should return medicines with quantity <= 5', async () => {
      const testLowStock = await prisma.userMedicine.create({
        data: {
          name: 'Test Low Stock',
          category: 'Test',
          unit: 'PILLS',
          quantity: 3,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          userId: testUser.id,
        },
      });

      const req = mockRequest({}, testUser);
      const res = mockResponse();

      await getLowStockMedicines(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.length).toBe(1);
      expect(responseData.data[0].id).toBe(testLowStock.id);
    });

    it('should order results by quantity (ascending)', async () => {
      const veryLowStock = await prisma.userMedicine.create({
        data: {
          name: 'Very Low Stock',
          category: 'Test',
          unit: 'PILLS',
          quantity: 1,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          userId: testUser.id,
        },
      });

      const lowStock = await prisma.userMedicine.create({
        data: {
          name: 'Low Stock',
          category: 'Test',
          unit: 'PILLS',
          quantity: 3,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          userId: testUser.id,
        },
      });

      const req = mockRequest({}, testUser);
      const res = mockResponse();

      await getLowStockMedicines(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData.data.length).toBe(2);
      expect(responseData.data[0].id).toBe(veryLowStock.id);
      expect(responseData.data[1].id).toBe(lowStock.id);
    });

    it('should include schedules and presetMedicine data', async () => {
      const lowStockWithSchedule = await prisma.userMedicine.create({
        data: {
          name: 'Low Stock with Schedule',
          category: 'Test',
          unit: 'PILLS',
          quantity: 2,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          userId: testUser.id,
          schedules: {
            create: {
              userId: testUser.id,
              timesOfDay: ['08:00'],
              repeatDays: ['Mon'],
              dosageAmount: 1,
            },
          },
        },
      });

      const req = mockRequest({}, testUser);
      const res = mockResponse();

      await getLowStockMedicines(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      
      const foundMedicine = responseData.data.find((m: any) => m.id === lowStockWithSchedule.id);
      expect(foundMedicine).toBeTruthy();
      expect(foundMedicine.schedules).toHaveLength(1);
      expect(foundMedicine.schedules[0].timesOfDay).toEqual(['08:00']);
    });
  });
});