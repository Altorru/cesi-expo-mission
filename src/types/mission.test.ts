import { Mission, MissionProof } from '@/types/mission';

describe('Mission Types', () => {
  it('should define Mission type with required fields', () => {
    const mission: Mission = {
      id: '1',
      title: 'Test Mission',
      description: 'Test Description',
      priority: 'Critique',
      status: 'En cours',
      created_by: 'user_1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(mission.id).toBe('1');
    expect(mission.title).toBe('Test Mission');
    expect(mission.description).toBe('Test Description');
    expect(mission.priority).toBe('Critique');
  });

  it('should define MissionProof type', () => {
    const proof: MissionProof = {
      id: '1',
      mission_id: 'mission_1',
      user_id: 'user_1',
      image_path: 'path/to/image.jpg',
      comment: 'Test comment',
      created_at: new Date().toISOString(),
    };

    expect(proof.mission_id).toBe('mission_1');
    expect(proof.user_id).toBe('user_1');
    expect(proof.image_path).toBeDefined();
  });

  it('should handle mission with optional fields', () => {
    const mission: Mission = {
      id: '2',
      title: 'Optional Mission',
      description: 'Description',
      priority: 'Normal',
      status: 'À faire',
      created_by: 'user_2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assigned_to: 'user_3',
    };

    expect(mission.assigned_to).toBe('user_3');
  });

  it('should have valid mission priorities', () => {
    const priorities = ['Critique', 'Urgent', 'Normal', 'Faible'];
    
    priorities.forEach((priority) => {
      const mission: Mission = {
        id: '1',
        title: 'Test',
        description: 'Test',
        priority: priority as any,
        status: 'En cours',
        created_by: 'user_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      expect(mission.priority).toBeTruthy();
    });
  });
});
