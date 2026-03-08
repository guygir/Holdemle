/**
 * GET /api/polls/[pollId]
 * Fetch poll question, options, and vote results
 * 
 * POST /api/polls/[pollId]
 * Submit or update a vote (authenticated users only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const { pollId } = params;
    const supabase = createAdminClient();

    // Fetch poll details
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .eq('is_active', true)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Fetch all votes for this poll
    const { data: votes, error: votesError } = await supabase
      .from('poll_votes')
      .select('option')
      .eq('poll_id', pollId);

    if (votesError) {
      console.error('Error fetching votes:', votesError);
      return NextResponse.json(
        { error: 'Failed to fetch votes' },
        { status: 500 }
      );
    }

    // Aggregate vote counts by option
    const voteCounts: Record<string, number> = {};
    const options = poll.options as string[];
    
    // Initialize all options with 0 votes
    options.forEach(option => {
      voteCounts[option] = 0;
    });

    // Count votes
    votes?.forEach((vote: { option: string }) => {
      if (voteCounts[vote.option] !== undefined) {
        voteCounts[vote.option]++;
      }
    });

    const totalVotes = votes?.length || 0;

    return NextResponse.json({
      poll: {
        id: poll.id,
        question: poll.question,
        options: poll.options,
      },
      results: {
        voteCounts,
        totalVotes,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/polls/[pollId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const { pollId } = params;
    const body = await request.json();
    const { option } = body;

    if (!option || typeof option !== 'string') {
      return NextResponse.json(
        { error: 'Invalid option' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('options')
      .eq('id', pollId)
      .eq('is_active', true)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Verify option is valid
    const options = poll.options as string[];
    if (!options.includes(option)) {
      return NextResponse.json(
        { error: 'Invalid option for this poll' },
        { status: 400 }
      );
    }

    // Upsert vote (insert or update if already exists)
    const { error: voteError } = await supabase
      .from('poll_votes')
      .upsert({
        poll_id: pollId,
        user_id: user.id,
        option,
        voted_at: new Date().toISOString(),
      }, {
        onConflict: 'poll_id,user_id'
      });

    if (voteError) {
      console.error('Error saving vote:', voteError);
      return NextResponse.json(
        { error: 'Failed to save vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/polls/[pollId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Bob
