import { CreateUserDto, UpdateUserDto, UpdateUserPasswordDto } from "@/lib/validations/user";
import IUserRepository from "repositories/IUserRepository";
import { UserRepository } from "repositories/UserRepository";
import bcrypt from "bcryptjs";

export class UserService {
    private static instance: UserService;

    private userRepository: IUserRepository;

    private constructor() {
        this.userRepository = new UserRepository();
    }

    public static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }

        return UserService.instance;
    }

    async registerUser(user: CreateUserDto) {

        //check if user already exists
        const existingUser = await this.getUserByEmail(user.email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash the user's password
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Create the new user
        const newUser = {
            ...user,
            password: hashedPassword, // Use hashed password
        };

        return await this.userRepository.create(newUser);
    }

    async getAllUsers() {
        return await this.userRepository.getAll();
    }

    async deleteUser(userID: string) {
        //check if last admin user

        const user = await this.getUserById(userID);

        if (!user) {
            throw new Error('User not found');
        }

        if (user.role !== 'admin') return await this.userRepository.delete(userID);

        const isLastAdminUser = await this.checkIfLastAdminUser();

        if (isLastAdminUser) {
            throw new Error('Cannot delete last admin user');
        }

        return await this.userRepository.delete(userID);
    }

    async checkIfLastAdminUser() {
        const users = await this.userRepository.getAll();
        const adminUsers = users.filter((user) => user.role === 'admin');

        return adminUsers.length === 1;
    }

    async getUserById(userID: string) {
        try {
            const user = await this.userRepository.getById(userID);

            return user;
        } catch {
            return null;
        }
    }

    async getUserByEmail(email: string) {
        try {
            const user = await this.userRepository.getByEmail(email);

            return user;
        } catch {
            return null;
        }
    }

    async updateUser(user: UpdateUserDto) {

        const foundUser = await this.getUserById(user.id);

        if (!foundUser) {
            throw new Error('User not found');
        }

        if (foundUser.role !== 'admin') return await this.userRepository.update(user);

        const isLastAdminUser = await this.checkIfLastAdminUser();

        if (user.role !== 'admin' && isLastAdminUser) {
            throw new Error('Cannot change last admin user to non-admin');
        }

        return await this.userRepository.update(user);
    }

    async updatePassword(updateUserPasswordDto: UpdateUserPasswordDto) {
        const user = await this.getUserById(updateUserPasswordDto.id);

        if (!user) {
            throw new Error('User not found');
        }

        const isPasswordValid = await bcrypt.compare(updateUserPasswordDto.currentPassword, user.password);

        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(updateUserPasswordDto.newPassword, 10);

        return await this.userRepository.updatePassword(updateUserPasswordDto.id, hashedPassword);
    }

    async createDefaultAdminUser() {

        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
            throw new Error('ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD must be set in the environment variables');
        }

        const adminUser: CreateUserDto = {
            firstName: 'Admin',
            lastName: 'User',
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            role: 'admin',
        };

        return await this.registerUser(adminUser);
    }
}