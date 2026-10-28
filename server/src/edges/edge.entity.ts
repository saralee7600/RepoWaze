import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import type { IEdge } from '@repowaze/shared';
import { ProjectEntity } from '../projects/project.entity';
import { NodeEntity } from '../nodes/node.entity';

@Entity('edges')
export class EdgeEntity implements IEdge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column()
  sourceNodeId: number;

  @Column()
  targetNodeId: number;

  @Column()
  relationType: string;

  @Column({ type: 'varchar', nullable: true })
  label: string | null;

  @ManyToOne(() => ProjectEntity, (project) => project.edges, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Relation<ProjectEntity>;

  @ManyToOne(() => NodeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceNodeId' })
  sourceNode: Relation<NodeEntity>;

  @ManyToOne(() => NodeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetNodeId' })
  targetNode: Relation<NodeEntity>;
}
