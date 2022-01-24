import DataLoader from "dataloader";
import { User } from "..//entities/User";

export const createUserLoader = () =>
    new DataLoader<number, User>(async (userIds) => {
        const users = await User.findByIds(userIds as number[]);
        const userIdToUser: Record<number, User> = {};
        users.forEach((user) => (userIdToUser[user.id] = user));

        // Not sure why we don't just return 'users' from line 6 - it seems to be equal to below?
        return userIds.map((userId) => userIdToUser[userId]);
    });
