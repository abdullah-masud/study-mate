"""Add table indexes for performance

Revision ID: b0666b48fc99
Revises: 24ec310c0125
Create Date: 2025-05-16 14:49:17.185078

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b0666b48fc99'
down_revision = '24ec310c0125'
branch_labels = None
depends_on = None


def upgrade():
       # Add indexes to optimise query performance
       op.create_index('idx_study_session_date', 'study_session', ['date'])
       op.create_index('idx_study_session_subject', 'study_session', ['subject'])
       
       # Add indexes to optimise user-related queries
       op.create_index('idx_share_record_shared_at', 'share_record', ['shared_at'])
       
       # Adding Indexes to Optimise Token Lookups
       op.create_index('idx_password_reset_expiry', 'password_reset_token', ['expiry'])


def downgrade():
       # If you need to roll back, delete the added index
       op.drop_index('idx_study_session_date', table_name='study_session')
       op.drop_index('idx_study_session_subject', table_name='study_session')
       op.drop_index('idx_share_record_shared_at', table_name='share_record')
       op.drop_index('idx_password_reset_expiry', table_name='password_reset_token')
