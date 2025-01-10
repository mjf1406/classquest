#!/bin/bash

# Define the endpoints and the number of requests
ENDPOINTS=("http://localhost:3000/api/getClassesGroupsStudents" "http://localhost:3000/api/allUserDataTest")
REQUESTS=100

# Arrays to store statistics for each endpoint
declare -a MIN_TIMES
declare -a MAX_TIMES
declare -a MEAN_TIMES
declare -a MEDIAN_TIMES

# Function to make requests and calculate statistics
make_requests() {
    local endpoint="$1"
    local times=()

    echo "Testing $endpoint with $REQUESTS requests..."

    for ((i=1; i<=REQUESTS; i++)); do
        printf "[%d/%d] Making request... " "$i" "$REQUESTS"

        # Capture start time in nanoseconds
        start_time=$(date +%s%N)

        # Make the request and capture the HTTP status code
        response=$(curl -s -w "%{http_code}" -o /dev/null "$endpoint")

        # Capture end time in nanoseconds
        end_time=$(date +%s%N)

        # Calculate duration in milliseconds
        duration=$(( (end_time - start_time) / 1000000 ))
        times+=("$duration")

        # Check for HTTP response
        if [ "$response" -eq 200 ]; then
            echo "completed in ${duration}ms"
        elif [ "$response" -eq 429 ]; then
            echo "failed with HTTP code 429 (Too Many Requests)"
            echo "Received 429 error. Exiting the script."
            exit 1
        else
            echo "failed with HTTP code $response"
        fi
    done

    if [ ${#times[@]} -gt 0 ]; then
        # Sort the times to calculate min, max, and median
        IFS=$'\n' sorted_times=($(sort -n <<<"${times[*]}"))
        unset IFS

        local min=${sorted_times[0]}
        local max=${sorted_times[-1]}

        # Calculate mean
        local sum=0
        for t in "${times[@]}"; do
            sum=$((sum + t))
        done
        local mean=$((sum / ${#times[@]}))

        # Calculate median
        local mid=$((${#sorted_times[@]} / 2))
        local median
        if (( ${#sorted_times[@]} % 2 == 0 )); then
            median=$(( (sorted_times[mid-1] + sorted_times[mid]) / 2 ))
        else
            median=${sorted_times[mid]}
        fi

        # Store the statistics in the respective arrays
        MIN_TIMES+=("$min")
        MAX_TIMES+=("$max")
        MEAN_TIMES+=("$mean")
        MEDIAN_TIMES+=("$median")
    fi
}

# Clear the terminal for a clean output
clear

# Iterate over each endpoint and collect statistics
for endpoint in "${ENDPOINTS[@]}"; do
    make_requests "$endpoint"
    echo ""
done

# Function to print the comparison table
print_table() {
    printf "\n%-50s | %-6s | %-6s | %-6s | %-6s\n" "Endpoint" "Min" "Max" "Mean" "Median"
    printf -- "----------------------------------------------------+--------+--------+--------+--------\n"
    for i in "${!ENDPOINTS[@]}"; do
        printf "%-50s | %-6sms | %-6sms | %-6sms | %-6sms\n" \
            "${ENDPOINTS[$i]}" "${MIN_TIMES[$i]}" "${MAX_TIMES[$i]}" "${MEAN_TIMES[$i]}" "${MEDIAN_TIMES[$i]}"
    done
}

# Print the final comparison table
print_table
