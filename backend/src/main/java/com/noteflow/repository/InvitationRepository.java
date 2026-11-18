package com.noteflow.repository;

import com.noteflow.entity.Invitation;
import com.noteflow.entity.enums.InvitationResourceType;
import com.noteflow.entity.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    Optional<Invitation> findByToken(String token);
    List<Invitation> findByInviteeEmailAndStatus(String inviteeEmail, InvitationStatus status);
    List<Invitation> findByInviterIdOrderByCreatedAtDesc(Long inviterId);
    Optional<Invitation> findByInviterIdAndInviteeEmailAndResourceIdAndResourceType(
        Long inviterId, String inviteeEmail, Long resourceId, InvitationResourceType resourceType);
}
