export class AvatarService {
  createAvatarFromName(name) {
    return {
      streamUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };
  }
}

export const avatarService = new AvatarService();
export default avatarService;
