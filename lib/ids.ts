import { nanoid } from 'nanoid';

export const createId = (size?: number) => nanoid(size);
