const {
    createAgent,
    getAllAgents,
    getAgentById,
    updateAgent,
    deleteAgent
} = require('../controllers/agentController');
const Agent = require('../models/Agent');

// Mock the Agent model
jest.mock('../models/Agent');

describe('Agent Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {},
            user: { _id: 'admin123', role: 'admin' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('createAgent', () => {
        const validAgentData = {
            name: 'John Doe',
            email: 'john@example.com',
            mobile: {
                countryCode: '+1',
                number: '1234567890'
            },
            password: 'password123'
        };

        it('should create agent successfully with valid data', async () => {
            req.body = validAgentData;

            const mockAgent = {
                _id: 'agent123',
                ...validAgentData,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                save: jest.fn().mockResolvedValue()
            };

            Agent.findByEmail.mockResolvedValue(null);
            Agent.findOne.mockResolvedValue(null);
            Agent.mockImplementation(() => mockAgent);

            await createAgent(req, res);

            expect(Agent.findByEmail).toHaveBeenCalledWith(validAgentData.email);
            expect(Agent.findOne).toHaveBeenCalledWith({
                'mobile.countryCode': validAgentData.mobile.countryCode,
                'mobile.number': validAgentData.mobile.number
            });
            expect(mockAgent.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: 'agent123',
                    name: validAgentData.name,
                    email: validAgentData.email
                }),
                message: 'Agent created successfully'
            });
        });

        it('should return validation error for missing required fields', async () => {
            req.body = { name: 'John' }; // Missing email, mobile, password

            await createAgent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: expect.any(Object)
                }
            });
        });

        it('should return error for duplicate email', async () => {
            req.body = validAgentData;

            Agent.findByEmail.mockResolvedValue({ _id: 'existing123' });

            await createAgent(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'DUPLICATE_ERROR',
                    message: 'Agent with this email already exists'
                }
            });
        });

        it('should return error for duplicate mobile number', async () => {
            req.body = validAgentData;

            Agent.findByEmail.mockResolvedValue(null);
            Agent.findOne.mockResolvedValue({ _id: 'existing123' });

            await createAgent(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'DUPLICATE_ERROR',
                    message: 'Agent with this mobile number already exists'
                }
            });
        });

        it('should handle database errors', async () => {
            req.body = validAgentData;

            Agent.findByEmail.mockRejectedValue(new Error('Database error'));

            await createAgent(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create agent'
                }
            });
        });
    });

    describe('getAllAgents', () => {
        it('should get all agents with default pagination', async () => {
            const mockAgents = [
                { _id: 'agent1', name: 'Agent 1', email: 'agent1@example.com' },
                { _id: 'agent2', name: 'Agent 2', email: 'agent2@example.com' }
            ];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockAgents)
            };

            Agent.find.mockReturnValue(mockQuery);
            Agent.countDocuments.mockResolvedValue(2);

            await getAllAgents(req, res);

            expect(Agent.find).toHaveBeenCalledWith({});
            expect(mockQuery.select).toHaveBeenCalledWith('-password');
            expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: 1 });
            expect(mockQuery.skip).toHaveBeenCalledWith(0);
            expect(mockQuery.limit).toHaveBeenCalledWith(10);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockAgents,
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalAgents: 2,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            });
        });

        it('should filter agents by active status', async () => {
            req.query = { isActive: 'true' };

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([])
            };

            Agent.find.mockReturnValue(mockQuery);
            Agent.countDocuments.mockResolvedValue(0);

            await getAllAgents(req, res);

            expect(Agent.find).toHaveBeenCalledWith({ isActive: true });
        });

        it('should handle database errors', async () => {
            Agent.find.mockImplementation(() => {
                throw new Error('Database error');
            });

            await getAllAgents(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to retrieve agents'
                }
            });
        });
    });

    describe('getAgentById', () => {
        it('should get agent by valid ID', async () => {
            req.params.id = '507f1f77bcf86cd799439011';
            const mockAgent = { _id: req.params.id, name: 'John Doe' };

            const mockQuery = {
                select: jest.fn().mockResolvedValue(mockAgent)
            };

            Agent.findById.mockReturnValue(mockQuery);

            await getAgentById(req, res);

            expect(Agent.findById).toHaveBeenCalledWith(req.params.id);
            expect(mockQuery.select).toHaveBeenCalledWith('-password');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockAgent
            });
        });

        it('should return error for invalid ID format', async () => {
            req.params.id = 'invalid-id';

            await getAgentById(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid agent ID format'
                }
            });
        });

        it('should return 404 for non-existent agent', async () => {
            req.params.id = '507f1f77bcf86cd799439011';

            const mockQuery = {
                select: jest.fn().mockResolvedValue(null)
            };

            Agent.findById.mockReturnValue(mockQuery);

            await getAgentById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Agent not found'
                }
            });
        });
    });

    describe('updateAgent', () => {
        const validUpdateData = {
            name: 'Updated Name',
            email: 'updated@example.com'
        };

        it('should update agent successfully', async () => {
            req.params.id = '507f1f77bcf86cd799439011';
            req.body = validUpdateData;

            const existingAgent = {
                _id: req.params.id,
                name: 'Old Name',
                email: 'old@example.com',
                mobile: { countryCode: '+1', number: '1234567890' }
            };

            const updatedAgent = { ...existingAgent, ...validUpdateData };

            Agent.findById.mockResolvedValue(existingAgent);
            Agent.findByEmail.mockResolvedValue(null);

            const mockQuery = {
                select: jest.fn().mockResolvedValue(updatedAgent)
            };

            Agent.findByIdAndUpdate.mockReturnValue(mockQuery);

            await updateAgent(req, res);

            expect(Agent.findById).toHaveBeenCalledWith(req.params.id);
            expect(Agent.findByEmail).toHaveBeenCalledWith(validUpdateData.email);
            expect(Agent.findByIdAndUpdate).toHaveBeenCalledWith(
                req.params.id,
                validUpdateData,
                { new: true, runValidators: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: updatedAgent,
                message: 'Agent updated successfully'
            });
        });

        it('should return error for invalid ID format', async () => {
            req.params.id = 'invalid-id';
            req.body = validUpdateData;

            await updateAgent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid agent ID format'
                }
            });
        });

        it('should return 404 for non-existent agent', async () => {
            req.params.id = '507f1f77bcf86cd799439011';
            req.body = validUpdateData;

            Agent.findById.mockResolvedValue(null);

            await updateAgent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Agent not found'
                }
            });
        });

        it('should return error for duplicate email', async () => {
            req.params.id = '507f1f77bcf86cd799439011';
            req.body = validUpdateData;

            const existingAgent = {
                _id: req.params.id,
                email: 'old@example.com'
            };

            Agent.findById.mockResolvedValue(existingAgent);
            Agent.findByEmail.mockResolvedValue({ _id: 'other123' });

            await updateAgent(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'DUPLICATE_ERROR',
                    message: 'Agent with this email already exists'
                }
            });
        });
    });

    describe('deleteAgent', () => {
        it('should delete agent successfully (soft delete)', async () => {
            req.params.id = '507f1f77bcf86cd799439011';

            const existingAgent = { _id: req.params.id, name: 'John Doe' };

            Agent.findById.mockResolvedValue(existingAgent);
            Agent.findByIdAndUpdate.mockResolvedValue();

            await deleteAgent(req, res);

            expect(Agent.findById).toHaveBeenCalledWith(req.params.id);
            expect(Agent.findByIdAndUpdate).toHaveBeenCalledWith(req.params.id, { isActive: false });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Agent deleted successfully'
            });
        });

        it('should return error for invalid ID format', async () => {
            req.params.id = 'invalid-id';

            await deleteAgent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid agent ID format'
                }
            });
        });

        it('should return 404 for non-existent agent', async () => {
            req.params.id = '507f1f77bcf86cd799439011';

            Agent.findById.mockResolvedValue(null);

            await deleteAgent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Agent not found'
                }
            });
        });
    });
});