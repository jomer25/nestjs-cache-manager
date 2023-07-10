import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { ErrorMessageDto } from './dto/error-message.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  async create(body: CreateUserDto): Promise<User> {
    const newUser = await this.userModel.create(body);
    return newUser;
  }

  async findAll(): Promise<User[]> {
    const cacheKey = 'all_users';

    let users: User[] = await this.cacheService.get<User[]>(cacheKey);

    if (!users) {
      users = await this.userModel.find().exec();
      await this.cacheService.set(cacheKey, users);
    }

    return users;
  }

  async findOne(id: string): Promise<User> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException(new ErrorMessageDto('Invalid'));
    }

    const cacheKey = `user_${id}`;

    let user: User = await this.cacheService.get<User>(cacheKey);

    if (!user) {
      user = await this.userModel.findOne({ _id: id }).exec();

      if (!user) {
        throw new NotFoundException(new ErrorMessageDto('Not Found'));
      }

      await this.cacheService.set(cacheKey, user);
    }
    
    return user;
  }

  async update(id: string, body: UpdateUserDto): Promise<User> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException(new ErrorMessageDto('Invalid'));
    }

    const cacheKey = `user_${id}`;

    const updatedUser = await this.userModel.findOneAndUpdate({ _id: id }, body, { new: true }).exec();

    if (!updatedUser) {
      throw new NotFoundException(new ErrorMessageDto('Not Found'));
    }

    await this.cacheService.set(cacheKey, updatedUser);

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException(new ErrorMessageDto('Invalid'));
    }

    const cacheKey = `user_${id}`;

    const deletedUser = await this.userModel.findOneAndDelete({ _id: id }).exec();

    if (!deletedUser) {
      throw new NotFoundException(new ErrorMessageDto('Not Found'));
    }

    await this.cacheService.del(cacheKey);
  }
}
