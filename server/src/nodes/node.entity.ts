import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import type { INode } from '@repowaze/shared';
import { ProjectEntity } from '../projects/project.entity';

@Entity('nodes')
export class NodeEntity implements INode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column()
  label: string;

  @Column()
  type: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @ManyToOne(() => ProjectEntity, (project) => project.nodes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Relation<ProjectEntity>;
}
