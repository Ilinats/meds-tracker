// import { PrismaClient } from '../../generated/test/client';
// import { addToCollection, removeFromCollection, getAllPresetMedicines, getUserMedicines, updateUserMedicine } from '../../modules/medicines/controllers/medicineController';
// import { Request, Response } from 'express';

// const prisma = new PrismaClient();

// interface AuthRequest extends Request {
//   user?: {
//     id: string;
//   };
// }

// const mockRequest = (body: any = {}, params: any = {}, query: any = {}, user: any = null): AuthRequest => ({
//   body,
//   params,
//   query,
//   user: user ? { id: user.id } : undefined,
// } as AuthRequest);

// const mockResponse = (): Response => {
//   const res: any = {};
//   res.status = jest.fn().mockReturnValue(res);
//   res.json = jest.fn().mockReturnValue(res);
//   return res as Response;
// };

// let testUser: any;
// let presetMedicine: any;
// let userMedicine: any;

// describe('Medicine Controller', () => {
//   beforeAll(async () => {
//     await prisma.medicineTaken.deleteMany();
//     await prisma.medicineSchedule.deleteMany();
//     await prisma.userMedicine.deleteMany();
//     await prisma.presetMedicine.deleteMany();
//     await prisma.user.deleteMany();

//     testUser = await prisma.user.create({
//       data: {
//         username: 'testuser',
//         password: 'testpassword',
//       },
//     });

//     presetMedicine = await prisma.presetMedicine.create({
//       data: {
//         name: 'Test Preset Medicine',
//         category: 'Test Category',
//         unit: 'PILLS',
//         description: 'Test description',
//         precautions: ['Precaution 1'],
//         adverseReactions: ['Reaction 1'],
//         dosageInstructions: ['Take with water'],
//         isFDA: true,
//       },
//     });

//     userMedicine = await prisma.userMedicine.create({
//       data: {
//         name: 'Test User Medicine',
//         category: 'Test Category',
//         unit: 'PILLS',
//         quantity: 30,
//         expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
//         userId: testUser.id,
//       },
//     });
//   });

//   afterAll(async () => {
//     await prisma.$disconnect();
//   });

//   describe('addToCollection', () => {
//     it('should add a new medicine to user collection', async () => {
//       const req = mockRequest({
//         name: 'New Medicine',
//         category: 'New Category',
//         unit: 'PILLS',
//         quantity: 20,
//         expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
//       }, {}, {}, testUser);
//       const res = mockResponse();

//       await addToCollection(req, res);

//       expect(res.status).toHaveBeenCalledWith(201);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: expect.objectContaining({
//           name: 'New Medicine',
//           category: 'New Category',
//           unit: 'PILLS',
//           quantity: 20,
//         }),
//       });

//       const medicine = await prisma.userMedicine.findFirst({
//         where: { name: 'New Medicine', userId: testUser.id },
//       });
//       expect(medicine).toBeTruthy();
//     });

//     it('should add a preset medicine to user collection', async () => {
//       const req = mockRequest({
//         name: 'Preset Medicine',
//         category: 'Preset Category',
//         unit: 'PILLS',
//         quantity: 15,
//         expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
//         presetMedicineId: presetMedicine.id,
//       }, {}, {}, testUser);
//       const res = mockResponse();

//       await addToCollection(req, res);

//       expect(res.status).toHaveBeenCalledWith(201);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: expect.objectContaining({
//           name: 'Preset Medicine',
//           isPreset: true,
//           presetMedicineId: presetMedicine.id,
//         }),
//       });
//     });

//     it('should add medicine with schedules', async () => {
//       const req = mockRequest({
//         name: 'Scheduled Medicine',
//         category: 'Scheduled Category',
//         unit: 'PILLS',
//         quantity: 10,
//         expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//         schedules: [
//           {
//             timesOfDay: ['08:00', '20:00'],
//             repeatDays: ['Mon', 'Wed', 'Fri'],
//             dosageAmount: 1,
//           },
//         ],
//       }, {}, {}, testUser);
//       const res = mockResponse();

//       await addToCollection(req, res);

//       expect(res.status).toHaveBeenCalledWith(201);
//       const responseData = (res.json as jest.Mock).mock.calls[0][0];
//       expect(responseData.data.schedules).toHaveLength(1);
//       expect(responseData.data.schedules[0].timesOfDay).toEqual(['08:00', '20:00']);
//     });

//     it('should return 401 if user is not authenticated', async () => {
//       const req = mockRequest({
//         name: 'Unauthenticated Medicine',
//         category: 'Unauth Category',
//         unit: 'PILLS',
//         quantity: 5,
//         expiryDate: new Date(),
//       });
//       const res = mockResponse();

//       await addToCollection(req, res);

//       expect(res.status).toHaveBeenCalledWith(401);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: { message: 'User not authenticated' },
//       });
//     });

//     it('should return 400 if required fields are missing', async () => {
//       const req = mockRequest({
//         name: 'Incomplete Medicine',
//       }, {}, {}, testUser);
//       const res = mockResponse();

//       await addToCollection(req, res);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: { message: 'Missing required fields' },
//       });
//     });
//   });

//   describe('removeFromCollection', () => {
//     it('should remove a medicine from user collection', async () => {
//       const medicineToRemove = await prisma.userMedicine.create({
//         data: {
//           name: 'Medicine to Remove',
//           category: 'Remove Category',
//           unit: 'PILLS',
//           quantity: 10,
//           expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//           userId: testUser.id,
//         },
//       });

//       const req = mockRequest({}, { id: medicineToRemove.id }, {}, testUser);
//       const res = mockResponse();

//       await removeFromCollection(req, res);

//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         message: 'Medicine removed from collection',
//       });

//       const medicine = await prisma.userMedicine.findUnique({
//         where: { id: medicineToRemove.id },
//       });
//       expect(medicine).toBeNull();
//     });

//     it('should remove medicine and its schedules', async () => {
//       const medicineWithSchedule = await prisma.userMedicine.create({
//         data: {
//           name: 'Medicine with Schedule',
//           category: 'Schedule Category',
//           unit: 'PILLS',
//           quantity: 10,
//           expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//           userId: testUser.id,
//           schedules: {
//             create: {
//               userId: testUser.id,
//               timesOfDay: ['08:00'],
//               repeatDays: ['Mon'],
//               dosageAmount: 1,
//             },
//           },
//         },
//         include: { schedules: true },
//       });

//       const req = mockRequest({}, { id: medicineWithSchedule.id }, {}, testUser);
//       const res = mockResponse();

//       await removeFromCollection(req, res);

//       expect(res.status).toHaveBeenCalledWith(200);

//       const schedules = await prisma.medicineSchedule.findMany({
//         where: { userMedicineId: medicineWithSchedule.id },
//       });
//       expect(schedules).toHaveLength(0);
//     });

//     it('should return 401 if user is not authenticated', async () => {
//       const req = mockRequest({}, { id: 'some-id' }); // No user
//       const res = mockResponse();

//       await removeFromCollection(req, res);

//       expect(res.status).toHaveBeenCalledWith(401);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: { message: 'User not authenticated' },
//       });
//     });

//     it('should return 404 if medicine not found', async () => {
//       const req = mockRequest({}, { id: 'non-existent-id' }, {}, testUser);
//       const res = mockResponse();

//       await removeFromCollection(req, res);

//       expect(res.status).toHaveBeenCalledWith(404);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: { message: 'Medicine not found' },
//       });
//     });
//   });

//   describe('getUserMedicines', () => {
//     beforeAll(async () => {
//       await prisma.userMedicine.createMany({
//         data: [
//           {
//             name: 'User Medicine 1',
//             category: 'Category A',
//             unit: 'PILLS',
//             quantity: 10,
//             expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//             userId: testUser.id,
//           },
//           {
//             name: 'User Medicine 2',
//             category: 'Category B',
//             unit: 'ML',
//             quantity: 100,
//             expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
//             userId: testUser.id,
//           },
//           {
//             name: 'Preset User Medicine',
//             category: 'Preset Category',
//             unit: 'PILLS',
//             quantity: 30,
//             expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
//             userId: testUser.id,
//             presetMedicineId: presetMedicine.id,
//             isPreset: true,
//           },
//         ],
//       });
//     });

//     it('should return all medicines for the authenticated user', async () => {
//       const req = mockRequest({}, {}, {}, testUser);
//       const res = mockResponse();

//       await getUserMedicines(req, res);

//       expect(res.status).toHaveBeenCalledWith(200);
//       const responseData = (res.json as jest.Mock).mock.calls[0][0];
//       expect(responseData.success).toBe(true);
//       expect(responseData.data.length).toBeGreaterThanOrEqual(4);
//     });

//     it('should filter medicines by search term', async () => {
//       const req = mockRequest({}, {}, { search: 'Medicine 1' }, testUser);
//       const res = mockResponse();

//       await getUserMedicines(req, res);

//       expect(res.status).toHaveBeenCalledWith(200);
//       const responseData = (res.json as jest.Mock).mock.calls[0][0];
//       expect(responseData.success).toBe(true);
//       expect(responseData.data.length).toBe(1);
//       expect(responseData.data[0].name).toBe('User Medicine 1');
//     });

//     it('should filter medicines by category', async () => {
//       const req = mockRequest({}, {}, { category: 'Category B' }, testUser);
//       const res = mockResponse();

//       await getUserMedicines(req, res);

//       expect(res.status).toHaveBeenCalledWith(200);
//       const responseData = (res.json as jest.Mock).mock.calls[0][0];
//       expect(responseData.success).toBe(true);
//       expect(responseData.data.length).toBe(1);
//       expect(responseData.data[0].category).toBe('Category B');
//     });

//     it('should include schedules and preset medicine data', async () => {
//       const medicineWithSchedule = await prisma.userMedicine.create({
//         data: {
//           name: 'Medicine with Schedule',
//           category: 'Schedule Category',
//           unit: 'PILLS',
//           quantity: 10,
//           expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//           userId: testUser.id,
//           schedules: {
//             create: {
//               userId: testUser.id,
//               timesOfDay: ['08:00'],
//               repeatDays: ['Mon'],
//               dosageAmount: 1,
//             },
//           },
//         },
//       });

//       const req = mockRequest({}, {}, {}, testUser);
//       const res = mockResponse();

//       await getUserMedicines(req, res);

//       expect(res.status).toHaveBeenCalledWith(200);
//       const responseData = (res.json as jest.Mock).mock.calls[0][0];
      
//       const foundMedicine = responseData.data.find((m: any) => m.id === medicineWithSchedule.id);
//       expect(foundMedicine).toBeTruthy();
//       expect(foundMedicine.schedules).toHaveLength(1);
//       expect(foundMedicine.schedules[0].timesOfDay).toEqual(['08:00']);
      
//       const presetUserMedicine = responseData.data.find((m: any) => m.isPreset);
//       expect(presetUserMedicine.presetMedicine).toBeTruthy();
//     });

//     it('should return 401 if user is not authenticated', async () => {
//       const req = mockRequest({}, {}, {}); // No user
//       const res = mockResponse();

//       await getUserMedicines(req, res);

//       expect(res.status).toHaveBeenCalledWith(401);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: { message: 'User not authenticated' },
//       });
//     });
//   });

//   describe('updateUserMedicine', () => {
//     it('should update basic medicine information', async () => {
//       const medicineToUpdate = await prisma.userMedicine.create({
//         data: {
//           name: 'Medicine to Update',
//           category: 'Update Category',
//           unit: 'PILLS',
//           quantity: 10,
//           expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//           userId: testUser.id,
//         },
//       });

//       const req = mockRequest({
//         name: 'Updated Medicine Name',
//         category: 'Updated Category',
//         quantity: 20,
//       }, { id: medicineToUpdate.id }, {}, testUser);
//       const res = mockResponse();

//       await updateUserMedicine(req, res);

//       expect(res.status).toHaveBeenCalledWith(200);
//       const responseData = (res.json as jest.Mock).mock.calls[0][0];
//       expect(responseData.success).toBe(true);
//       expect(responseData.data.name).toBe('Updated Medicine Name');
//       expect(responseData.data.category).toBe('Updated Category');
//       expect(responseData.data.quantity).toBe(20);

//       const updatedMedicine = await prisma.userMedicine.findUnique({
//         where: { id: medicineToUpdate.id },
//       });
//       expect(updatedMedicine?.name).toBe('Updated Medicine Name');
//     });

//     it('should update medicine schedules', async () => {
//       const medicineWithSchedule = await prisma.userMedicine.create({
//         data: {
//           name: 'Medicine with Schedule to Update',
//           category: 'Schedule Update Category',
//           unit: 'PILLS',
//           quantity: 10,
//           expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//           userId: testUser.id,
//           schedules: {
//             create: {
//               userId: testUser.id,
//               timesOfDay: ['08:00'],
//               repeatDays: ['Mon'],
//               dosageAmount: 1,
//             },
//           },
//         },
//         include: { schedules: true },
//       });

//       const req = mockRequest({
//         schedules: [
//           {
//             timesOfDay: ['12:00', '18:00'],
//             repeatDays: ['Tue', 'Thu'],
//             dosageAmount: 2,
//           },
//         ],
//       }, { id: medicineWithSchedule.id }, {}, testUser);
//       const res = mockResponse();

//       await updateUserMedicine(req, res);

//       expect(res.status).toHaveBeenCalledWith(200);
//       const responseData = (res.json as jest.Mock).mock.calls[0][0];
//       expect(responseData.data.schedules).toHaveLength(1);
//       expect(responseData.data.schedules[0].timesOfDay).toEqual(['12:00', '18:00']);
//       expect(responseData.data.schedules[0].repeatDays).toEqual(['Tue', 'Thu']);
//       expect(responseData.data.schedules[0].dosageAmount).toBe(2);

//       const oldSchedules = await prisma.medicineSchedule.findMany({
//         where: { id: medicineWithSchedule.schedules[0].id },
//       });
//       expect(oldSchedules).toHaveLength(0);
//     });

//     it('should return 401 if user is not authenticated', async () => {
//       const req = mockRequest({}, { id: 'some-id' }); // No user
//       const res = mockResponse();

//       await updateUserMedicine(req, res);

//       expect(res.status).toHaveBeenCalledWith(401);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: { message: 'User not authenticated' },
//       });
//     });

//     it('should return 404 if medicine not found', async () => {
//       const req = mockRequest({}, { id: 'non-existent-id' }, {}, testUser);
//       const res = mockResponse();

//       await updateUserMedicine(req, res);

//       expect(res.status).toHaveBeenCalledWith(404);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: { message: 'Medicine not found' },
//       });
//     });
//   });
// });